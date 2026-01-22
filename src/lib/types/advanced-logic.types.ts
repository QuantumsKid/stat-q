/**
 * Advanced Conditional Logic Types
 * Supports AND/OR combinations, complex branching, and conditional behaviors
 */

import type { ConditionOperator } from './question.types';

// Logical operators for combining conditions
export type LogicalOperator = 'AND' | 'OR';

// Single condition within a logic rule
export interface LogicCondition {
  id: string;
  sourceQuestionId: string;
  operator: ConditionOperator;
  value: unknown;
}

// Group of conditions combined with AND/OR
export interface LogicConditionGroup {
  id: string;
  operator: LogicalOperator; // How to combine conditions in this group
  conditions: LogicCondition[];
}

// Actions that can be taken when logic conditions are met
export type LogicAction =
  | 'show'           // Show target questions
  | 'hide'           // Hide target questions
  | 'require'        // Make target questions required
  | 'unrequire'      // Make target questions optional
  | 'set_value'      // Set value in target question (field piping)
  | 'calculate';     // Calculate value for target question

// Value for set_value action
export interface SetValueAction {
  type: 'set_value';
  targetQuestionId: string;
  value: unknown | 'piped'; // 'piped' means copy value from source question
  sourceQuestionId?: string; // For piping
}

// Calculate action
export interface CalculateAction {
  type: 'calculate';
  targetQuestionId: string;
  formula: string; // Simple formula like "Q1 + Q2" or "Q1 * 2"
  sourceQuestionIds: string[];
}

// Advanced logic rule with support for complex conditions
export interface AdvancedLogicRule {
  id: string;
  name?: string; // Optional description/comment
  enabled: boolean; // Can disable without deleting

  // Conditions - can be nested groups with AND/OR
  conditionGroups: LogicConditionGroup[];
  groupOperator: LogicalOperator; // How to combine groups

  // Actions to take when all conditions are met
  action: LogicAction;
  targetQuestionIds: string[];

  // Additional action data
  setValue?: SetValueAction;
  calculate?: CalculateAction;

  // Priority for conflicting rules (higher = takes precedence)
  priority?: number;
}

// Backward compatibility: Convert old LogicRule to AdvancedLogicRule
export interface LegacyLogicRule {
  id: string;
  sourceQuestionId: string;
  condition: ConditionOperator;
  value: unknown;
  action: 'show' | 'hide';
  targetQuestionIds: string[];
}

// Helper to convert legacy to advanced
export function convertLegacyToAdvanced(legacy: LegacyLogicRule): AdvancedLogicRule {
  return {
    id: legacy.id,
    enabled: true,
    conditionGroups: [
      {
        id: `group-${legacy.id}`,
        operator: 'AND',
        conditions: [
          {
            id: `condition-${legacy.id}`,
            sourceQuestionId: legacy.sourceQuestionId,
            operator: legacy.condition,
            value: legacy.value,
          },
        ],
      },
    ],
    groupOperator: 'AND',
    action: legacy.action,
    targetQuestionIds: legacy.targetQuestionIds,
  };
}

// Helper to convert advanced to legacy (for backward compatibility)
export function convertAdvancedToLegacy(advanced: AdvancedLogicRule): LegacyLogicRule | null {
  // Can only convert simple rules (1 group, 1 condition, show/hide action)
  if (
    advanced.conditionGroups.length !== 1 ||
    advanced.conditionGroups[0].conditions.length !== 1 ||
    (advanced.action !== 'show' && advanced.action !== 'hide')
  ) {
    return null; // Too complex to convert
  }

  const condition = advanced.conditionGroups[0].conditions[0];

  return {
    id: advanced.id,
    sourceQuestionId: condition.sourceQuestionId,
    condition: condition.operator,
    value: condition.value,
    action: advanced.action,
    targetQuestionIds: advanced.targetQuestionIds,
  };
}

// Evaluation result for logic rules
export interface LogicEvaluationResult {
  hiddenQuestionIds: Set<string>;
  requiredQuestionIds: Set<string>;
  optionalQuestionIds: Set<string>;
  setValue: Map<string, unknown>; // questionId -> value to set
  calculated: Map<string, number>; // questionId -> calculated value
}

// Conditional requirement configuration
export interface ConditionalRequirement {
  questionId: string;
  required: boolean;
  conditions: LogicConditionGroup[];
  conditionOperator: LogicalOperator;
}
