import type { LogicRule, Question } from '@/lib/types/question.types';

/**
 * Evaluate conditional logic rules to determine which questions should be hidden
 */

export function evaluateLogic(
  rules: LogicRule[],
  answers: Record<string, unknown>,
  questions: Question[]
): Set<string> {
  const hiddenQuestionIds = new Set<string>();

  rules.forEach((rule) => {
    const answer = answers[rule.sourceQuestionId];
    const conditionMet = evaluateCondition(rule.condition, answer, rule.value);

    if (conditionMet) {
      if (rule.action === 'hide') {
        rule.targetQuestionIds.forEach((id) => hiddenQuestionIds.add(id));
      } else if (rule.action === 'show') {
        // Remove from hidden set if showing
        rule.targetQuestionIds.forEach((id) => hiddenQuestionIds.delete(id));
      }
    }
  });

  return hiddenQuestionIds;
}

export function evaluateCondition(
  operator: string,
  answer: unknown,
  value: unknown
): boolean {
  // Handle empty/null answers
  if (answer === null || answer === undefined || answer === '') {
    return operator === 'is_empty';
  }

  // Extract actual value from AnswerValue object for different question types
  let actualValue: unknown = answer;

  if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
    const answerObj = answer as Record<string, unknown>;

    // For checkboxes, extract choice_ids array
    if ('choice_ids' in answerObj) {
      actualValue = answerObj.choice_ids;
    }
    // For multiple choice/dropdown, extract choice_id
    else if ('choice_id' in answerObj) {
      actualValue = answerObj.choice_id;
    }
    // For text questions, extract text
    else if ('text' in answerObj) {
      actualValue = answerObj.text;
    }
    // For linear scale, extract scale_value
    else if ('scale_value' in answerObj) {
      actualValue = answerObj.scale_value;
    }
    // For date/time, use the object as-is or extract specific field
    else if ('date' in answerObj || 'time' in answerObj) {
      actualValue = answerObj.date || answerObj.time;
    }
  }

  switch (operator) {
    case 'equals':
      // For arrays (checkboxes), check if arrays are equal
      if (Array.isArray(actualValue) && Array.isArray(value)) {
        if (actualValue.length !== value.length) return false;
        return actualValue.every((v) => value.includes(v));
      }
      // For arrays compared to single value, check if array contains only that value
      if (Array.isArray(actualValue) && !Array.isArray(value)) {
        return actualValue.length === 1 && actualValue[0] === value;
      }
      return actualValue === value;

    case 'not_equals':
      // For arrays, check if arrays are NOT equal
      if (Array.isArray(actualValue) && Array.isArray(value)) {
        if (actualValue.length !== value.length) return true;
        return !actualValue.every((v) => value.includes(v));
      }
      // For arrays compared to single value
      if (Array.isArray(actualValue) && !Array.isArray(value)) {
        return actualValue.length !== 1 || actualValue[0] !== value;
      }
      return actualValue !== value;

    case 'contains':
      if (typeof actualValue === 'string' && typeof value === 'string') {
        return actualValue.toLowerCase().includes(value.toLowerCase());
      }
      // For checkbox arrays, check if the value is in the selected choices
      if (Array.isArray(actualValue)) {
        return actualValue.includes(value);
      }
      return false;

    case 'not_contains':
      if (typeof actualValue === 'string' && typeof value === 'string') {
        return !actualValue.toLowerCase().includes(value.toLowerCase());
      }
      // For checkbox arrays, check if the value is NOT in the selected choices
      if (Array.isArray(actualValue)) {
        return !actualValue.includes(value);
      }
      return true;

    case 'greater_than':
      if (typeof actualValue === 'number' && typeof value === 'number') {
        return actualValue > value;
      }
      if (typeof actualValue === 'string' && typeof value === 'string') {
        return actualValue > value;
      }
      return false;

    case 'less_than':
      if (typeof actualValue === 'number' && typeof value === 'number') {
        return actualValue < value;
      }
      if (typeof actualValue === 'string' && typeof value === 'string') {
        return actualValue < value;
      }
      return false;

    case 'is_empty':
      return false; // Already handled above

    case 'is_not_empty':
      return true; // If we got here, answer is not empty

    default:
      return false;
  }
}

/**
 * Get questions that can be used as conditions (all questions before the current one)
 */
export function getAvailableConditionQuestions(
  currentQuestionId: string,
  allQuestions: Question[]
): Question[] {
  const currentIndex = allQuestions.findIndex((q) => q.id === currentQuestionId);
  if (currentIndex === -1) return [];

  // Return all questions before this one
  return allQuestions.slice(0, currentIndex);
}

/**
 * Get questions that can be targeted by logic rules (all questions after the current one)
 */
export function getAvailableTargetQuestions(
  currentQuestionId: string,
  allQuestions: Question[]
): Question[] {
  const currentIndex = allQuestions.findIndex((q) => q.id === currentQuestionId);
  if (currentIndex === -1) return [];

  // Return all questions after this one
  return allQuestions.slice(currentIndex + 1);
}

/**
 * Detect circular dependencies in logic rules
 * Returns an array of question IDs involved in circular dependencies
 */
export function detectCircularLogic(
  questions: Question[]
): string[] {
  const circularIds = new Set<string>();

  // Build dependency graph
  const dependencies = new Map<string, Set<string>>();

  questions.forEach((q) => {
    if (q.logic_rules && q.logic_rules.length > 0) {
      q.logic_rules.forEach((rule) => {
        // Rule from sourceQuestion affects current question
        if (!dependencies.has(rule.sourceQuestionId)) {
          dependencies.set(rule.sourceQuestionId, new Set());
        }
        dependencies.get(rule.sourceQuestionId)!.add(q.id);
      });
    }
  });

  // Detect cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(questionId: string): boolean {
    visited.add(questionId);
    recursionStack.add(questionId);

    const deps = dependencies.get(questionId);
    if (deps) {
      for (const depId of deps) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            circularIds.add(questionId);
            circularIds.add(depId);
            return true;
          }
        } else if (recursionStack.has(depId)) {
          circularIds.add(questionId);
          circularIds.add(depId);
          return true;
        }
      }
    }

    recursionStack.delete(questionId);
    return false;
  }

  // Check all questions
  questions.forEach((q) => {
    if (!visited.has(q.id)) {
      hasCycle(q.id);
    }
  });

  return Array.from(circularIds);
}

/**
 * Get operator options based on question type
 */
export function getOperatorsForQuestionType(questionType: string): Array<{
  value: string;
  label: string;
}> {
  const commonOperators = [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  const textOperators = [
    ...commonOperators,
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
  ];

  const numberOperators = [
    ...commonOperators,
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
  ];

  switch (questionType) {
    case 'short_text':
    case 'long_text':
      return textOperators;

    case 'linear_scale':
    case 'date_time':
      return numberOperators;

    case 'multiple_choice':
    case 'checkboxes':
    case 'dropdown':
      return commonOperators;

    default:
      return commonOperators;
  }
}
