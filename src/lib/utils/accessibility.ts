/**
 * Accessibility Utilities
 * Provides ARIA helpers and accessibility utilities
 */

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Announce message to screen readers using live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Create or get existing live region
  let liveRegion = document.getElementById('screen-reader-announcer');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'screen-reader-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Update priority if different
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and announce
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * ARIA label helpers for common patterns
 */
export const ariaLabels = {
  // Form labels
  required: (label: string) => `${label} (required)`,
  optional: (label: string) => `${label} (optional)`,

  // Input states
  invalid: (label: string, error: string) => `${label}, ${error}`,
  valid: (label: string) => `${label}, valid`,

  // Actions
  edit: (itemName: string) => `Edit ${itemName}`,
  delete: (itemName: string) => `Delete ${itemName}`,
  duplicate: (itemName: string) => `Duplicate ${itemName}`,
  moveUp: (itemName: string) => `Move ${itemName} up`,
  moveDown: (itemName: string) => `Move ${itemName} down`,

  // Status
  loading: (action: string) => `${action}, please wait`,
  success: (action: string) => `${action} successful`,
  error: (action: string, error: string) => `${action} failed: ${error}`,

  // Navigation
  page: (current: number, total: number) => `Page ${current} of ${total}`,
  item: (current: number, total: number, type: string) =>
    `${type} ${current} of ${total}`,

  // Progress
  progress: (percent: number, description: string) =>
    `${description}, ${percent}% complete`,
};

/**
 * Add accessibility attributes to an element
 */
export function addAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | boolean | number>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    const attrName = key.startsWith('aria-') ? key : `aria-${key}`;
    element.setAttribute(attrName, String(value));
  });
}

/**
 * Create accessible button
 */
export function makeButtonAccessible(
  button: HTMLElement,
  options: {
    label: string;
    description?: string;
    pressed?: boolean;
    expanded?: boolean;
    controls?: string;
    hasPopup?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'true' | 'false';
  }
): void {
  button.setAttribute('role', 'button');
  button.setAttribute('aria-label', options.label);

  if (options.description) {
    const descId = generateAriaId('desc');
    const descElement = document.createElement('span');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = options.description;
    button.appendChild(descElement);
    button.setAttribute('aria-describedby', descId);
  }

  if (options.pressed !== undefined) {
    button.setAttribute('aria-pressed', String(options.pressed));
  }

  if (options.expanded !== undefined) {
    button.setAttribute('aria-expanded', String(options.expanded));
  }

  if (options.controls) {
    button.setAttribute('aria-controls', options.controls);
  }

  if (options.hasPopup) {
    button.setAttribute('aria-haspopup', options.hasPopup);
  }

  // Ensure keyboard accessibility
  if (!button.hasAttribute('tabindex')) {
    button.setAttribute('tabindex', '0');
  }
}

/**
 * Create accessible form field
 */
export function makeFormFieldAccessible(
  input: HTMLElement,
  options: {
    label: string;
    required?: boolean;
    invalid?: boolean;
    error?: string;
    description?: string;
  }
): { labelId: string; errorId?: string; descriptionId?: string } {
  const ids: { labelId: string; errorId?: string; descriptionId?: string } = {
    labelId: generateAriaId('label'),
  };

  // Set label
  input.setAttribute('aria-label', options.label);
  input.setAttribute('aria-labelledby', ids.labelId);

  // Required
  if (options.required) {
    input.setAttribute('aria-required', 'true');
  }

  // Invalid state
  if (options.invalid) {
    input.setAttribute('aria-invalid', 'true');

    if (options.error) {
      ids.errorId = generateAriaId('error');
      input.setAttribute('aria-describedby', ids.errorId);
    }
  } else {
    input.setAttribute('aria-invalid', 'false');
  }

  // Description
  if (options.description) {
    ids.descriptionId = generateAriaId('description');
    const currentDescribedBy = input.getAttribute('aria-describedby');
    const describedBy = currentDescribedBy
      ? `${currentDescribedBy} ${ids.descriptionId}`
      : ids.descriptionId;
    input.setAttribute('aria-describedby', describedBy);
  }

  return ids;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Focus management utilities
 */
export const focus = {
  /**
   * Save current focus
   */
  save(): HTMLElement | null {
    return document.activeElement as HTMLElement | null;
  },

  /**
   * Restore focus to previously saved element
   */
  restore(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  /**
   * Move focus to element
   */
  moveTo(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  /**
   * Move focus to first error in form
   */
  moveToFirstError(form: HTMLElement): boolean {
    const errorElement = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (errorElement) {
      this.moveTo(errorElement);
      return true;
    }
    return false;
  },
};
