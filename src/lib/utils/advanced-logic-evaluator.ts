/**
 * Advanced Logic Evaluator
 * Evaluates complex conditional logic with AND/OR combinations
 */

import type { Question } from '@/lib/types/question.types';
import type {
  AdvancedLogicRule,
  LogicCondition,
  LogicConditionGroup,
  LogicEvaluationResult,
  LogicalOperator,
} from '@/lib/types/advanced-logic.types';
import { evaluateCondition } from './logic-evaluator';

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(
  condition: LogicCondition,
  answers: Record<string, unknown>
): boolean {
  const answer = answers[condition.sourceQuestionId];
  return evaluateCondition(condition.operator, answer, condition.value);
}

/**
 * Evaluate a group of conditions combined with AND/OR
 */
function evaluateConditionGroup(
  group: LogicConditionGroup,
  answers: Record<string, unknown>
): boolean {
  if (group.conditions.length === 0) {
    return true; // Empty group is always true
  }

  const results = group.conditions.map((condition) =>
    evaluateSingleCondition(condition, answers)
  );

  if (group.operator === 'AND') {
    return results.every((result) => result === true);
  } else {
    // OR
    return results.some((result) => result === true);
  }
}

/**
 * Evaluate all condition groups combined with group operator
 */
function evaluateAllGroups(
  groups: LogicConditionGroup[],
  groupOperator: LogicalOperator,
  answers: Record<string, unknown>
): boolean {
  if (groups.length === 0) {
    return true; // No conditions means always true
  }

  const groupResults = groups.map((group) =>
    evaluateConditionGroup(group, answers)
  );

  if (groupOperator === 'AND') {
    return groupResults.every((result) => result === true);
  } else {
    // OR
    return groupResults.some((result) => result === true);
  }
}

/**
 * Evaluate field piping - get value from source question
 */
function getPipedValue(
  sourceQuestionId: string,
  answers: Record<string, unknown>
): unknown {
  const answer = answers[sourceQuestionId];

  if (!answer || typeof answer !== 'object') {
    return answer;
  }

  const answerObj = answer as Record<string, unknown>;

  // Extract actual value based on answer type
  if ('text' in answerObj) return answerObj.text;
  if ('choice_id' in answerObj) return answerObj.choice_id;
  if ('choice_ids' in answerObj) return answerObj.choice_ids;
  if ('scale_value' in answerObj) return answerObj.scale_value;
  if ('date' in answerObj) return answerObj.date;

  return answer;
}

/**
 * Evaluate calculation formula
 */
function evaluateCalculation(
  formula: string,
  sourceQuestionIds: string[],
  answers: Record<string, unknown>
): number | null {
  try {
    // Simple formula evaluation (supports +, -, *, /, parentheses)
    let expression = formula;

    // Replace Q1, Q2, etc. with actual values
    sourceQuestionIds.forEach((questionId) => {
      const value = getPipedValue(questionId, answers);
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));

      if (isNaN(numValue)) {
        throw new Error(`Invalid number for question ${questionId}`);
      }

      // Replace all occurrences of Q{index}
      const index = sourceQuestionIds.indexOf(questionId) + 1;
      expression = expression.replace(new RegExp(`Q${index}`, 'g'), String(numValue));
    });

    // Safely evaluate the expression
    // Note: Using Function constructor is safer than eval
    const result = new Function(`'use strict'; return (${expression})`)();

    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}

/**
 * Main evaluation function for advanced logic rules
 */
export function evaluateAdvancedLogic(
  rules: AdvancedLogicRule[],
  answers: Record<string, unknown>,
  questions: Question[]
): LogicEvaluationResult {
  const result: LogicEvaluationResult = {
    hiddenQuestionIds: new Set(),
    requiredQuestionIds: new Set(),
    optionalQuestionIds: new Set(),
    setValue: new Map(),
    calculated: new Map(),
  };

  // Track which priority set each action (to handle conflicts)
  const actionPriorities = new Map<string, {
    hide?: number;
    show?: number;
    require?: number;
    unrequire?: number;
  }>();

  // Sort rules by priority (higher first)
  const sortedRules = [...rules].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    return priorityB - priorityA;
  });

  // Evaluate each rule
  for (const rule of sortedRules) {
    // Skip disabled rules
    if (!rule.enabled) {
      continue;
    }

    // Evaluate conditions
    const conditionsMet = evaluateAllGroups(
      rule.conditionGroups,
      rule.groupOperator,
      answers
    );

    if (!conditionsMet) {
      continue; // Conditions not met, skip this rule
    }

    const rulePriority = rule.priority ?? 0;

    // Apply actions based on rule type
    switch (rule.action) {
      case 'show':
      case 'hide': {
        const action = rule.action; // Narrow the type
        rule.targetQuestionIds.forEach((id) => {
          const priorities = actionPriorities.get(id) || {};
          const currentPriority = priorities[action] ?? -Infinity;

          // Only apply if this rule has higher or equal priority than existing
          if (rulePriority >= currentPriority) {
            if (action === 'hide') {
              result.hiddenQuestionIds.add(id);
            } else {
              result.hiddenQuestionIds.delete(id);
            }

            actionPriorities.set(id, {
              ...priorities,
              [action]: rulePriority,
            });
          }
        });
        break;
      }

      case 'require':
      case 'unrequire': {
        const action = rule.action; // Narrow the type
        rule.targetQuestionIds.forEach((id) => {
          const priorities = actionPriorities.get(id) || {};
          const currentPriority = priorities[action] ?? -Infinity;

          // Only apply if this rule has higher or equal priority than existing
          if (rulePriority >= currentPriority) {
            if (action === 'require') {
              result.requiredQuestionIds.add(id);
              result.optionalQuestionIds.delete(id);
            } else {
              result.optionalQuestionIds.add(id);
              result.requiredQuestionIds.delete(id);
            }

            actionPriorities.set(id, {
              ...priorities,
              [action]: rulePriority,
            });
          }
        });
        break;
      }

      case 'set_value':
        if (rule.setValue) {
          const value =
            rule.setValue.value === 'piped' && rule.setValue.sourceQuestionId
              ? getPipedValue(rule.setValue.sourceQuestionId, answers)
              : rule.setValue.value;

          result.setValue.set(rule.setValue.targetQuestionId, value);
        }
        break;

      case 'calculate':
        if (rule.calculate) {
          const calculatedValue = evaluateCalculation(
            rule.calculate.formula,
            rule.calculate.sourceQuestionIds,
            answers
          );

          if (calculatedValue !== null) {
            result.calculated.set(rule.calculate.targetQuestionId, calculatedValue);
          }
        }
        break;
    }
  }

  return result;
}

/**
 * Check if a question should be required based on conditional logic
 */
export function isConditionallyRequired(
  questionId: string,
  result: LogicEvaluationResult,
  originalRequired: boolean
): boolean {
  // Check if explicitly set to required by logic
  if (result.requiredQuestionIds.has(questionId)) {
    return true;
  }

  // Check if explicitly set to optional by logic
  if (result.optionalQuestionIds.has(questionId)) {
    return false;
  }

  // Fall back to original required state
  return originalRequired;
}

/**
 * Get value to display in a question (including piped/calculated values)
 */
export function getQuestionValue(
  questionId: string,
  result: LogicEvaluationResult,
  currentValue?: unknown
): unknown {
  // Check for piped value
  if (result.setValue.has(questionId)) {
    return result.setValue.get(questionId);
  }

  // Check for calculated value
  if (result.calculated.has(questionId)) {
    return { scale_value: result.calculated.get(questionId) };
  }

  // Return current value
  return currentValue;
}

/**
 * Validate that logic rules don't have circular dependencies
 */
export function validateAdvancedLogicRules(
  rules: AdvancedLogicRule[],
  questions: Question[]
): { valid: boolean; circularQuestionIds: string[] } {
  const dependencies = new Map<string, Set<string>>();

  // Build dependency graph
  rules.forEach((rule) => {
    rule.targetQuestionIds.forEach((targetId) => {
      if (!dependencies.has(targetId)) {
        dependencies.set(targetId, new Set());
      }

      rule.conditionGroups.forEach((group) => {
        group.conditions.forEach((condition) => {
          dependencies.get(targetId)!.add(condition.sourceQuestionId);
        });
      });
    });
  });

  // Detect cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularIds = new Set<string>();

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

  questions.forEach((q) => {
    if (!visited.has(q.id)) {
      hasCycle(q.id);
    }
  });

  return {
    valid: circularIds.size === 0,
    circularQuestionIds: Array.from(circularIds),
  };
}
