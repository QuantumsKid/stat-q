import type { Choice } from '@/lib/types/question.types';
import { nanoid } from 'nanoid';

/**
 * Utility functions for managing question options
 */

export function createOption(label: string = ''): Choice {
  return {
    id: nanoid(),
    label,
  };
}

export function addOption(
  options: Choice[],
  label: string = 'Option'
): Choice[] {
  const newOption = createOption(`${label} ${options.length + 1}`);
  return [...options, newOption];
}

export function removeOption(
  options: Choice[],
  optionId: string
): Choice[] {
  return options.filter((opt) => opt.id !== optionId);
}

export function updateOption(
  options: Choice[],
  optionId: string,
  updates: Partial<Choice>
): Choice[] {
  return options.map((opt) =>
    opt.id === optionId ? { ...opt, ...updates } : opt
  );
}

export function reorderOptions(
  options: Choice[],
  oldIndex: number,
  newIndex: number
): Choice[] {
  const result = [...options];
  const [removed] = result.splice(oldIndex, 1);
  result.splice(newIndex, 0, removed);
  return result;
}

export function hasOtherOption(options: Choice[]): boolean {
  return options.some((opt) => opt.isOther);
}

export function toggleOtherOption(
  options: Choice[],
  enabled: boolean
): Choice[] {
  if (enabled && !hasOtherOption(options)) {
    // Add "Other" option
    return [...options, { id: nanoid(), label: 'Other', isOther: true }];
  } else if (!enabled && hasOtherOption(options)) {
    // Remove "Other" option
    return options.filter((opt) => !opt.isOther);
  }
  return options;
}
