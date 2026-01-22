/**
 * Keyboard Navigation Utilities
 * Provides keyboard shortcuts and navigation helpers for accessibility
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  handler: (event: KeyboardEvent) => void;
}

/**
 * Check if a keyboard event matches a shortcut definition
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const altMatches = !!shortcut.alt === event.altKey;
  const shiftMatches = !!shortcut.shift === event.shiftKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches;
}

/**
 * Register keyboard shortcuts
 */
export function registerShortcuts(
  shortcuts: KeyboardShortcut[],
  element: HTMLElement | Document = document
): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.handler(event);
        break;
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown as EventListener);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown as EventListener);
  };
}

/**
 * Common keyboard shortcuts for forms
 */
export const FORM_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save form' },
  PREVIEW: { key: 'p', ctrl: true, description: 'Preview form' },
  ADD_QUESTION: { key: 'q', ctrl: true, description: 'Add new question' },
  DUPLICATE: { key: 'd', ctrl: true, description: 'Duplicate current item' },
  DELETE: { key: 'Backspace', ctrl: true, shift: true, description: 'Delete current item' },
  MOVE_UP: { key: 'ArrowUp', alt: true, description: 'Move item up' },
  MOVE_DOWN: { key: 'ArrowDown', alt: true, description: 'Move item down' },
  ESCAPE: { key: 'Escape', description: 'Close dialog or cancel' },
  NEXT: { key: 'ArrowRight', description: 'Next question' },
  PREVIOUS: { key: 'ArrowLeft', description: 'Previous question' },
  SUBMIT: { key: 'Enter', ctrl: true, description: 'Submit form' },
} as const;

/**
 * Get focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }
  );
}

/**
 * Trap focus within a container (useful for modals/dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Navigate through a list of items with arrow keys
 */
export function enableArrowKeyNavigation(
  container: HTMLElement,
  options: {
    itemSelector: string;
    onSelect?: (item: HTMLElement, index: number) => void;
    loop?: boolean; // Whether to loop from last to first
  }
): () => void {
  const { itemSelector, onSelect, loop = true } = options;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(event.key)) {
      return;
    }

    const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1;
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0;
        }
        break;

      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;

      case 'Enter':
        if (currentIndex >= 0 && onSelect) {
          event.preventDefault();
          onSelect(items[currentIndex], currentIndex);
        }
        return;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Skip to main content link handler
 */
export function initializeSkipLinks(): void {
  const skipLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

  skipLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href')?.slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
