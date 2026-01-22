'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and jump directly to main content
 * Visible only when focused via keyboard
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        // Position absolutely at the top
        'absolute left-0 top-0 z-[9999]',
        // Hidden by default, shown when focused
        'sr-only focus:not-sr-only',
        // Styling when visible
        'focus:fixed focus:left-4 focus:top-4',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'font-medium text-sm',
        'transition-all',
        className
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Skip Links Container
 * Wrapper for multiple skip links
 */
export function SkipLinks({ children }: { children: React.ReactNode }) {
  return (
    <div className="skip-links" aria-label="Skip links">
      {children}
    </div>
  );
}
