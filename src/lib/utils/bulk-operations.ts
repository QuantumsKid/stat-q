/**
 * Bulk Operations Utilities
 * Provides utilities for bulk operations on questions and forms
 */

import type { Question } from '@/lib/types/question.types';

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Bulk delete questions
 */
export async function bulkDeleteQuestions(
  questionIds: string[],
  deleteHandler: (id: string) => Promise<{ error?: string }>
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const id of questionIds) {
    const response = await deleteHandler(id);
    if (response.error) {
      result.failureCount++;
      result.errors.push({ id, error: response.error });
      result.success = false;
    } else {
      result.successCount++;
    }
  }

  return result;
}

/**
 * Bulk duplicate questions
 */
export async function bulkDuplicateQuestions(
  questionIds: string[],
  questions: Question[],
  duplicateHandler: (question: Question) => Promise<{ data?: Question; error?: string }>
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const id of questionIds) {
    const question = questions.find((q) => q.id === id);
    if (!question) {
      result.failureCount++;
      result.errors.push({ id, error: 'Question not found' });
      continue;
    }

    const response = await duplicateHandler(question);
    if (response.error) {
      result.failureCount++;
      result.errors.push({ id, error: response.error });
      result.success = false;
    } else {
      result.successCount++;
    }
  }

  return result;
}

/**
 * Bulk update question property
 */
export async function bulkUpdateQuestionProperty<K extends keyof Question>(
  questionIds: string[],
  property: K,
  value: Question[K],
  updateHandler: (id: string, updates: Partial<Question>) => Promise<{ error?: string }>
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const id of questionIds) {
    const response = await updateHandler(id, { [property]: value });
    if (response.error) {
      result.failureCount++;
      result.errors.push({ id, error: response.error });
      result.success = false;
    } else {
      result.successCount++;
    }
  }

  return result;
}

/**
 * Bulk move questions (reorder)
 */
export async function bulkMoveQuestions(
  questionIds: string[],
  targetIndex: number,
  questions: Question[],
  reorderHandler: (formId: string, newOrder: string[]) => Promise<{ error?: string }>
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  if (questionIds.length === 0) {
    result.errors.push({ id: 'bulk', error: 'No questions selected' });
    result.success = false;
    return result;
  }

  // Get form ID from first question
  const firstQuestion = questions.find((q) => q.id === questionIds[0]);
  if (!firstQuestion) {
    result.errors.push({ id: questionIds[0], error: 'Question not found' });
    result.success = false;
    return result;
  }

  // Create new order
  const questionsByFormId = questions.filter((q) => q.form_id === firstQuestion.form_id);
  const sortedQuestions = [...questionsByFormId].sort((a, b) => a.order_index - b.order_index);

  // Remove selected questions
  const withoutSelected = sortedQuestions.filter((q) => !questionIds.includes(q.id));

  // Get selected questions in their original order
  const selectedQuestions = sortedQuestions.filter((q) => questionIds.includes(q.id));

  // Insert at target index
  const newOrder = [
    ...withoutSelected.slice(0, targetIndex),
    ...selectedQuestions,
    ...withoutSelected.slice(targetIndex),
  ];

  const newOrderIds = newOrder.map((q) => q.id);

  const response = await reorderHandler(firstQuestion.form_id, newOrderIds);
  if (response.error) {
    result.failureCount = questionIds.length;
    result.errors.push({ id: 'bulk', error: response.error });
    result.success = false;
  } else {
    result.successCount = questionIds.length;
  }

  return result;
}

/**
 * Validate bulk operation
 */
export function validateBulkOperation(
  questionIds: string[],
  questions: Question[],
  operation: 'delete' | 'duplicate' | 'move'
): { valid: boolean; error?: string } {
  if (questionIds.length === 0) {
    return { valid: false, error: 'No questions selected' };
  }

  // Check if all questions exist
  const allExist = questionIds.every((id) => questions.some((q) => q.id === id));
  if (!allExist) {
    return { valid: false, error: 'Some selected questions do not exist' };
  }

  // For move operation, check if all questions are from the same form
  if (operation === 'move') {
    const formIds = new Set(
      questionIds.map((id) => questions.find((q) => q.id === id)?.form_id).filter(Boolean)
    );
    if (formIds.size > 1) {
      return { valid: false, error: 'Cannot move questions from different forms' };
    }
  }

  return { valid: true };
}

/**
 * Get bulk operation summary message
 */
export function getBulkOperationSummary(
  operation: 'delete' | 'duplicate' | 'move' | 'update',
  result: BulkOperationResult
): string {
  const total = result.successCount + result.failureCount;

  if (result.success) {
    switch (operation) {
      case 'delete':
        return `Successfully deleted ${result.successCount} question${result.successCount === 1 ? '' : 's'}`;
      case 'duplicate':
        return `Successfully duplicated ${result.successCount} question${result.successCount === 1 ? '' : 's'}`;
      case 'move':
        return `Successfully moved ${result.successCount} question${result.successCount === 1 ? '' : 's'}`;
      case 'update':
        return `Successfully updated ${result.successCount} question${result.successCount === 1 ? '' : 's'}`;
    }
  } else {
    return `Completed with ${result.successCount}/${total} successful, ${result.failureCount} failed`;
  }
}
