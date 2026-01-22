/**
 * Auto-save hook with retry logic and exponential backoff
 * Enhances the existing autosave with network resilience
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { retry } from '@/lib/utils/retry';

export interface AutosaveOptions<T> {
  delay?: number; // Debounce delay in milliseconds
  maxRetries?: number;
  onSaveSuccess?: (data: T) => void;
  onSaveError?: (error: Error) => void;
  onRollback?: (data: T) => void; // Called when rolling back to last saved state
  showToasts?: boolean;
  enableOptimisticUpdates?: boolean; // Enable optimistic UI updates
}

export function useAutosaveWithRetry<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  options: AutosaveOptions<T> = {}
) {
  const {
    delay = 3000,
    maxRetries = 3,
    onSaveSuccess,
    onSaveError,
    onRollback,
    showToasts = true,
    enableOptimisticUpdates = true,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const lastSuccessfulSaveRef = useRef<T>(data); // Track last successful save for rollback
  const retryCountRef = useRef(0);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        // Attempt save with retry logic
        await retry(
          async () => {
            await onSave(data);
          },
          {
            maxRetries,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              retryCountRef.current = attempt;
              if (showToasts) {
                toast.loading(`Retrying save (attempt ${attempt}/${maxRetries})...`, {
                  id: 'autosave-retry',
                });
              }
            },
          }
        );

        // Save successful
        setLastSaved(new Date());
        previousDataRef.current = data;
        lastSuccessfulSaveRef.current = data; // Update last successful save snapshot
        retryCountRef.current = 0;

        if (showToasts && retryCountRef.current > 0) {
          toast.dismiss('autosave-retry');
          toast.success('Saved after retry');
        }

        onSaveSuccess?.(data);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setSaveError(err);

        if (showToasts) {
          toast.dismiss('autosave-retry');

          // Distinguish between network and validation errors
          if (err.message.includes('network') || err.message.includes('fetch')) {
            toast.error('Network error. Your changes were not saved. Please check your connection.', {
              duration: 10000,
              action: {
                label: 'Rollback',
                onClick: () => {
                  // Rollback to last successful save
                  rollback();
                },
              },
            });
          } else {
            toast.error(`Save failed: ${err.message}`, {
              duration: 5000,
              action: {
                label: 'Rollback',
                onClick: () => {
                  rollback();
                },
              },
            });
          }
        }

        onSaveError?.(err);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, maxRetries, showToasts, onSaveSuccess, onSaveError]);

  // Manual save function
  const save = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    try {
      await retry(() => onSave(data), { maxRetries });
      setLastSaved(new Date());
      previousDataRef.current = data;
      lastSuccessfulSaveRef.current = data;
      if (showToasts) {
        toast.success('Saved manually');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setSaveError(err);
      if (showToasts) {
        toast.error(`Save failed: ${err.message}`);
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Rollback function - restores data to last successful save
  const rollback = () => {
    if (onRollback) {
      onRollback(lastSuccessfulSaveRef.current);
    }
    previousDataRef.current = lastSuccessfulSaveRef.current;
    setSaveError(null);

    if (showToasts) {
      toast.success('Rolled back to last saved version');
    }
  };

  // Get last successful save data
  const getLastSuccessfulSave = () => {
    return lastSuccessfulSaveRef.current;
  };

  return {
    isSaving,
    lastSaved,
    saveError,
    save, // Manual save function
    rollback, // Rollback to last successful save
    getLastSuccessfulSave, // Get last successful save snapshot
    hasUnsavedChanges: JSON.stringify(data) !== JSON.stringify(previousDataRef.current),
    hasFailedSave: saveError !== null,
  };
}
