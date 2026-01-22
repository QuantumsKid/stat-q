/**
 * Form Access Control Utilities
 * Handles form scheduling, password protection, and response limits
 */

import bcrypt from 'bcryptjs';

export interface FormAccess {
  isPublished: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  maxResponses: number | null;
  currentResponses: number;
  passwordHash: string | null;
  requireLogin: boolean;
}

export interface FormAccessCheck {
  canAccess: boolean;
  reason?: 'not_published' | 'not_started' | 'ended' | 'full' | 'password_required' | 'login_required';
  message?: string;
  startsAt?: Date;
  endsAt?: Date;
  responsesRemaining?: number;
}

/**
 * Check if a form is currently accessible
 */
export function checkFormAccess(
  formAccess: FormAccess,
  options: {
    hasPassword?: boolean;
    isLoggedIn?: boolean;
  } = {}
): FormAccessCheck {
  const { hasPassword = false, isLoggedIn = false } = options;

  // Check if published
  if (!formAccess.isPublished) {
    return {
      canAccess: false,
      reason: 'not_published',
      message: 'This form is not currently published.',
    };
  }

  // Check schedule start
  if (formAccess.scheduleStart) {
    const startDate = new Date(formAccess.scheduleStart);
    if (new Date() < startDate) {
      return {
        canAccess: false,
        reason: 'not_started',
        message: `This form will be available starting ${startDate.toLocaleString()}.`,
        startsAt: startDate,
      };
    }
  }

  // Check schedule end
  if (formAccess.scheduleEnd) {
    const endDate = new Date(formAccess.scheduleEnd);
    if (new Date() > endDate) {
      return {
        canAccess: false,
        reason: 'ended',
        message: 'This form is no longer accepting responses.',
        endsAt: endDate,
      };
    }
  }

  // Check response limit
  if (formAccess.maxResponses !== null) {
    if (formAccess.currentResponses >= formAccess.maxResponses) {
      return {
        canAccess: false,
        reason: 'full',
        message: 'This form has reached its response limit.',
      };
    }
  }

  // Check login requirement
  if (formAccess.requireLogin && !isLoggedIn) {
    return {
      canAccess: false,
      reason: 'login_required',
      message: 'You must be logged in to access this form.',
    };
  }

  // Check password requirement
  if (formAccess.passwordHash && !hasPassword) {
    return {
      canAccess: false,
      reason: 'password_required',
      message: 'This form requires a password to access.',
    };
  }

  // Calculate responses remaining
  let responsesRemaining: number | undefined;
  if (formAccess.maxResponses !== null) {
    responsesRemaining = formAccess.maxResponses - formAccess.currentResponses;
  }

  return {
    canAccess: true,
    responsesRemaining,
  };
}

/**
 * Hash a form password
 */
export async function hashFormPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a form password
 */
export async function verifyFormPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get form status label
 */
export function getFormStatusLabel(formAccess: FormAccess): {
  status: 'draft' | 'scheduled' | 'active' | 'ending_soon' | 'closed' | 'full';
  label: string;
  color: 'gray' | 'blue' | 'green' | 'yellow' | 'red';
} {
  if (!formAccess.isPublished) {
    return { status: 'draft', label: 'Draft', color: 'gray' };
  }

  const now = new Date();

  // Check if full
  if (
    formAccess.maxResponses !== null &&
    formAccess.currentResponses >= formAccess.maxResponses
  ) {
    return { status: 'full', label: 'Full', color: 'red' };
  }

  // Check if not started
  if (formAccess.scheduleStart && now < new Date(formAccess.scheduleStart)) {
    return { status: 'scheduled', label: 'Scheduled', color: 'blue' };
  }

  // Check if ended
  if (formAccess.scheduleEnd && now > new Date(formAccess.scheduleEnd)) {
    return { status: 'closed', label: 'Closed', color: 'red' };
  }

  // Check if ending soon (within 24 hours)
  if (formAccess.scheduleEnd) {
    const endDate = new Date(formAccess.scheduleEnd);
    const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilEnd <= 24) {
      return { status: 'ending_soon', label: 'Ending Soon', color: 'yellow' };
    }
  }

  return { status: 'active', label: 'Active', color: 'green' };
}

/**
 * Calculate time remaining until form closes
 */
export function getTimeRemaining(endDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(endDate: Date): string {
  const { days, hours, minutes, totalSeconds } = getTimeRemaining(endDate);

  if (totalSeconds <= 0) {
    return 'Closed';
  }

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} remaining`;
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
  }

  return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
}
