// Conditional Logic Types

import type { Question } from './question.types';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface LogicRule {
  id: string;
  sourceQuestionId: string;
  condition: ConditionOperator;
  value: unknown;
  action: 'show' | 'hide';
  targetQuestionIds: string[];
}

export interface LogicEvaluationContext {
  answers: Record<string, unknown>;
  questions: Question[];
}

export interface LogicEvaluationResult {
  hiddenQuestionIds: Set<string>;
  visibleQuestionIds: Set<string>;
}
