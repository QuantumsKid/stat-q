'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Screen Reader Announcer Component
 * Provides accessible announcements for dynamic content changes
 * Uses ARIA live regions to communicate updates to assistive technologies
 */

export type AnnouncementPriority = 'polite' | 'assertive';

interface Announcement {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

interface ScreenReaderAnnouncerProps {
  /**
   * Unique identifier for this announcer instance
   */
  id?: string;
  /**
   * Default priority for announcements
   * @default 'polite'
   */
  defaultPriority?: AnnouncementPriority;
}

/**
 * Screen Reader Announcer - renders invisible live regions for screen readers
 */
export function ScreenReaderAnnouncer({
  id = 'sr-announcer',
  defaultPriority = 'polite',
}: ScreenReaderAnnouncerProps) {
  const [politeAnnouncements, setPoliteAnnouncements] = useState<Announcement[]>([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<Announcement[]>([]);

  // Clear old announcements after they've been read (3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPoliteAnnouncements((prev) => prev.filter((a) => now - a.timestamp < 3000));
      setAssertiveAnnouncements((prev) => prev.filter((a) => now - a.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Polite announcements - don't interrupt current speech */}
      <div
        id={`${id}-polite`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Assertive announcements - interrupt current speech (use sparingly) */}
      <div
        id={`${id}-assertive`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </>
  );
}

/**
 * Hook for making screen reader announcements
 * Provides a simple API for announcing dynamic content changes
 */
export function useScreenReaderAnnouncement() {
  const announcementId = useRef(0);

  const announce = (message: string, priority: AnnouncementPriority = 'polite') => {
    if (typeof window === 'undefined') return;

    const id = `announcement-${++announcementId.current}`;
    const announcement: Announcement = {
      id,
      message,
      priority,
      timestamp: Date.now(),
    };

    // Dispatch custom event that the ScreenReaderAnnouncer will listen for
    window.dispatchEvent(
      new CustomEvent('sr-announce', {
        detail: announcement,
      })
    );
  };

  const announcePolite = (message: string) => announce(message, 'polite');
  const announceAssertive = (message: string) => announce(message, 'assertive');

  return {
    announce,
    announcePolite,
    announceAssertive,
  };
}

/**
 * Global Screen Reader Announcer with event listener
 * Place this once in your root layout
 */
export function GlobalScreenReaderAnnouncer() {
  const [politeMessages, setPoliteMessages] = useState<string[]>([]);
  const [assertiveMessages, setAssertiveMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleAnnouncement = (event: Event) => {
      const customEvent = event as CustomEvent<Announcement>;
      const { message, priority } = customEvent.detail;

      if (priority === 'assertive') {
        setAssertiveMessages((prev) => [...prev, message]);
        setTimeout(() => {
          setAssertiveMessages((prev) => prev.filter((m) => m !== message));
        }, 3000);
      } else {
        setPoliteMessages((prev) => [...prev, message]);
        setTimeout(() => {
          setPoliteMessages((prev) => prev.filter((m) => m !== message));
        }, 3000);
      }
    };

    window.addEventListener('sr-announce', handleAnnouncement);
    return () => window.removeEventListener('sr-announce', handleAnnouncement);
  }, []);

  return (
    <>
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {politeMessages.map((message, index) => (
          <p key={`polite-${index}-${message.slice(0, 20)}`}>{message}</p>
        ))}
      </div>

      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        className="sr-only"
      >
        {assertiveMessages.map((message, index) => (
          <p key={`assertive-${index}-${message.slice(0, 20)}`}>{message}</p>
        ))}
      </div>
    </>
  );
}

/**
 * Utility function for immediate screen reader announcement (no hook)
 * Useful for one-off announcements in server actions or event handlers
 */
export function announceToScreenReader(
  message: string,
  priority: AnnouncementPriority = 'polite'
) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('sr-announce', {
      detail: {
        id: `announcement-${Date.now()}`,
        message,
        priority,
        timestamp: Date.now(),
      },
    })
  );
}
