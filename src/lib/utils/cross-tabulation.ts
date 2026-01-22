/**
 * Cross-tabulation utility for analyzing relationships between questions
 */

import type { TypedQuestion } from '../types/question.types';
import type { Answer, AnswerValue } from '../types/response.types';
import { calculateDescriptiveStats, calculateFrequencyDistribution } from './statistics-engine';

export interface CrossTabResult {
  filterQuestion: TypedQuestion;
  targetQuestion: TypedQuestion;
  categories: CrossTabCategory[];
  totalResponses: number;
}

export interface CrossTabCategory {
  filterValue: string; // The filter category (e.g., "Male", "Female")
  filterValueLabel: string; // Human-readable label
  count: number; // Number of responses in this category
  targetStats: TargetStats;
}

export type TargetStats =
  | NumericTargetStats
  | CategoricalTargetStats
  | TextTargetStats;

export interface NumericTargetStats {
  type: 'numeric';
  mean: number;
  median: number;
  mode: number | string | null;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  values: number[];
}

export interface CategoricalTargetStats {
  type: 'categorical';
  distribution: Array<{ label: string; count: number; percentage: number }>;
  topChoice: string | null;
}

export interface TextTargetStats {
  type: 'text';
  sampleResponses: string[];
  totalResponses: number;
}

/**
 * Check if a question type is suitable for filtering (categorical)
 */
export function isCategoricalQuestion(question: TypedQuestion): boolean {
  return ['multiple_choice', 'checkboxes', 'dropdown', 'linear_scale'].includes(question.type);
}

/**
 * Check if a question type has numeric values
 */
export function isNumericQuestion(question: TypedQuestion): boolean {
  return ['linear_scale', 'slider'].includes(question.type);
}

/**
 * Extract filter value from an answer
 */
function getFilterValue(answer: Answer, question: TypedQuestion): string[] {
  const value = answer.value as AnswerValue;

  if (!value) return [];

  switch (question.type) {
    case 'multiple_choice':
    case 'dropdown':
      return value.choice_id ? [value.choice_id] : [];

    case 'checkboxes':
      return value.choice_ids || [];

    case 'linear_scale':
      return value.scale_value !== undefined ? [String(value.scale_value)] : [];

    default:
      return [];
  }
}

/**
 * Get label for a filter value
 */
function getFilterValueLabel(filterValue: string, question: TypedQuestion): string {
  if (question.type === 'linear_scale') {
    return filterValue; // Already a string representation of the number
  }

  // For choice-based questions
  if (question.type === 'multiple_choice' ||
      question.type === 'checkboxes' ||
      question.type === 'dropdown') {
    const options = question.options;
    if (options && 'choices' in options) {
      const choice = options.choices?.find((c: { id: string }) => c.id === filterValue);
      return choice ? (choice as { label?: string }).label || filterValue : filterValue;
    }
  }

  return filterValue;
}

/**
 * Extract target value from an answer
 */
function getTargetValue(answer: Answer): AnswerValue {
  return answer.value as AnswerValue;
}

/**
 * Calculate statistics for numeric target question
 */
function calculateNumericStats(answers: Answer[]): NumericTargetStats {
  const values = answers
    .map(a => {
      const value = a.value as AnswerValue;
      return value.scale_value ?? value.slider_value ?? null;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return {
      type: 'numeric',
      mean: 0,
      median: 0,
      mode: null,
      min: 0,
      max: 0,
      stdDev: 0,
      variance: 0,
      values: [],
    };
  }

  const stats = calculateDescriptiveStats(values);

  return {
    type: 'numeric',
    mean: stats.mean ?? 0,
    median: stats.median ?? 0,
    mode: stats.mode,
    min: stats.min ?? 0,
    max: stats.max ?? 0,
    stdDev: stats.stdDev ?? 0,
    variance: stats.variance ?? 0,
    values,
  };
}

/**
 * Calculate statistics for categorical target question
 */
function calculateCategoricalStats(answers: Answer[], targetQuestion: TypedQuestion): CategoricalTargetStats {
  const values: string[] = [];

  answers.forEach(answer => {
    const value = answer.value as AnswerValue;

    if (targetQuestion.type === 'multiple_choice' || targetQuestion.type === 'dropdown') {
      if (value.choice_id) values.push(value.choice_id);
    } else if (targetQuestion.type === 'checkboxes') {
      if (value.choice_ids) values.push(...value.choice_ids);
    } else if (targetQuestion.type === 'linear_scale') {
      if (value.scale_value !== undefined) values.push(String(value.scale_value));
    }
  });

  const frequency = calculateFrequencyDistribution(values);

  // Get choice labels
  const distribution = frequency.items.map(item => {
    let label = item.value;

    if (targetQuestion.type === 'multiple_choice' ||
        targetQuestion.type === 'checkboxes' ||
        targetQuestion.type === 'dropdown') {
      const options = targetQuestion.options;
      if (options && 'choices' in options) {
        const choice = options.choices?.find((c: { id: string }) => c.id === item.value);
        label = choice ? (choice as { label?: string }).label || item.value : item.value;
      }
    }

    return {
      label: String(label),
      count: item.count,
      percentage: item.percentage,
    };
  });

  return {
    type: 'categorical',
    distribution,
    topChoice: distribution.length > 0 ? distribution[0].label : null,
  };
}

/**
 * Calculate statistics for text target question
 */
function calculateTextStats(answers: Answer[]): TextTargetStats {
  const texts = answers
    .map(a => {
      const value = a.value as AnswerValue;
      return value.text || '';
    })
    .filter(t => t.trim().length > 0);

  return {
    type: 'text',
    sampleResponses: texts.slice(0, 5), // First 5 responses
    totalResponses: texts.length,
  };
}

/**
 * Perform cross-tabulation analysis
 */
export function calculateCrossTabulation(
  filterQuestion: TypedQuestion,
  targetQuestion: TypedQuestion,
  answersByQuestion: Record<string, Answer[]>
): CrossTabResult {
  const filterAnswers = answersByQuestion[filterQuestion.id] || [];
  const targetAnswers = answersByQuestion[targetQuestion.id] || [];

  // Group responses by response_id for matching
  const responseMap = new Map<string, { filter: Answer; target: Answer }>();

  filterAnswers.forEach(filterAnswer => {
    const targetAnswer = targetAnswers.find(ta => ta.response_id === filterAnswer.response_id);
    if (targetAnswer) {
      responseMap.set(filterAnswer.response_id, {
        filter: filterAnswer,
        target: targetAnswer,
      });
    }
  });

  // Group by filter values
  const categoryMap = new Map<string, Answer[]>();

  responseMap.forEach(({ filter, target }) => {
    const filterValues = getFilterValue(filter, filterQuestion);

    filterValues.forEach(filterValue => {
      if (!categoryMap.has(filterValue)) {
        categoryMap.set(filterValue, []);
      }
      categoryMap.get(filterValue)!.push(target);
    });
  });

  // Calculate stats for each category
  const categories: CrossTabCategory[] = [];

  categoryMap.forEach((targetAnswers, filterValue) => {
    let targetStats: TargetStats;

    if (isNumericQuestion(targetQuestion)) {
      targetStats = calculateNumericStats(targetAnswers);
    } else if (isCategoricalQuestion(targetQuestion)) {
      targetStats = calculateCategoricalStats(targetAnswers, targetQuestion);
    } else {
      targetStats = calculateTextStats(targetAnswers);
    }

    categories.push({
      filterValue,
      filterValueLabel: getFilterValueLabel(filterValue, filterQuestion),
      count: targetAnswers.length,
      targetStats,
    });
  });

  // Sort categories by count (descending)
  categories.sort((a, b) => b.count - a.count);

  return {
    filterQuestion,
    targetQuestion,
    categories,
    totalResponses: responseMap.size,
  };
}
