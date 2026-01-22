import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Shallow comparison utility for objects
function shallowEqual<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

export function useAutosave<T extends Record<string, unknown>>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay: number = 3000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Skip if data hasn't changed (using shallow comparison for performance)
    if (shallowEqual(data, previousDataRef.current)) {
      return;
    }

    // Skip if currently saving
    if (isSavingRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;
        setIsSaving(true);
        await onSave(data);
        previousDataRef.current = data;
        setLastSaved(new Date());
        toast.success('Saved', { duration: 1000 });
      } catch (error) {
        toast.error('Failed to save changes');
        console.error('Autosave error:', error);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay]);

  return { isSaving, lastSaved };
}
