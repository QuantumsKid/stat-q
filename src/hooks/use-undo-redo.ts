import { useState, useCallback, useEffect, useRef } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UndoRedoActions<T> {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  set: (newPresent: T, clearFuture?: boolean) => void;
  reset: (newPresent: T) => void;
  clear: () => void;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number; // Maximum number of states to keep in history
  debounceMs?: number; // Debounce time for automatic state saves
}

/**
 * Hook for undo/redo functionality
 * Manages a history of states with undo and redo capabilities
 *
 * @param initialState - The initial state
 * @param options - Configuration options
 * @returns [current state, undo/redo actions]
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): [T, UndoRedoActions<T>] {
  const { maxHistorySize = 50, debounceMs = 500 } = options;

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<T>(initialState);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.past.length === 0) {
        return currentHistory;
      }

      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.future.length === 0) {
        return currentHistory;
      }

      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const set = useCallback(
    (newPresent: T, clearFuture = true) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Only save to history if the state actually changed
      if (JSON.stringify(newPresent) === JSON.stringify(lastSavedStateRef.current)) {
        return;
      }

      setHistory((currentHistory) => {
        // Limit past history size
        let newPast = [...currentHistory.past, currentHistory.present];
        if (newPast.length > maxHistorySize) {
          newPast = newPast.slice(newPast.length - maxHistorySize);
        }

        return {
          past: newPast,
          present: newPresent,
          future: clearFuture ? [] : currentHistory.future,
        };
      });

      lastSavedStateRef.current = newPresent;
    },
    [maxHistorySize]
  );

  const setDebounced = useCallback(
    (newPresent: T) => {
      setHistory((currentHistory) => ({
        ...currentHistory,
        present: newPresent,
      }));

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to save to history
      debounceTimerRef.current = setTimeout(() => {
        set(newPresent, true);
      }, debounceMs);
    },
    [debounceMs, set]
  );

  const reset = useCallback((newPresent: T) => {
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
    lastSavedStateRef.current = newPresent;
  }, []);

  const clear = useCallback(() => {
    setHistory((currentHistory) => ({
      past: [],
      present: currentHistory.present,
      future: [],
    }));
  }, []);

  return [
    history.present,
    {
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undo,
      redo,
      set: setDebounced,
      reset,
      clear,
    },
  ];
}
