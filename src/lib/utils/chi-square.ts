/**
 * Chi-square test for independence between categorical variables
 */

import type { TypedQuestion } from '../types/question.types';
import type { Answer, AnswerValue } from '../types/response.types';

export interface ChiSquareResult {
  question1: TypedQuestion;
  question2: TypedQuestion;
  chiSquare: number; // Chi-square statistic
  degreesOfFreedom: number;
  pValue: number; // Statistical significance (0-1)
  cramersV: number; // Effect size (0-1)
  isSignificant: boolean; // p < 0.05
  contingencyTable: ContingencyTable;
  sampleSize: number;
}

export interface ContingencyTable {
  rowLabels: string[]; // Labels for question 1
  columnLabels: string[]; // Labels for question 2
  observed: number[][]; // Observed frequencies
  expected: number[][]; // Expected frequencies
  rowTotals: number[];
  columnTotals: number[];
  total: number;
}

/**
 * Check if a question is categorical
 */
export function isCategoricalQuestion(question: TypedQuestion): boolean {
  return ['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type);
}

/**
 * Extract categorical value(s) from an answer
 */
function getCategoricalValues(answer: Answer, question: TypedQuestion): string[] {
  const value = answer.value as AnswerValue;

  if (!value) return [];

  switch (question.type) {
    case 'multiple_choice':
    case 'dropdown':
      return value.choice_id ? [value.choice_id] : [];

    case 'checkboxes':
      return value.choice_ids || [];

    default:
      return [];
  }
}

/**
 * Get label for a choice
 */
function getChoiceLabel(choiceId: string, question: TypedQuestion): string {
  if (question.type === 'multiple_choice' ||
      question.type === 'checkboxes' ||
      question.type === 'dropdown') {
    const options = question.options;
    if (options && 'choices' in options) {
      const choice = options.choices?.find((c: { id: string }) => c.id === choiceId);
      return choice ? (choice as { label?: string }).label || choiceId : choiceId;
    }
  }

  return choiceId;
}

/**
 * Build contingency table from paired responses
 */
function buildContingencyTable(
  question1: TypedQuestion,
  question2: TypedQuestion,
  answers1: Answer[],
  answers2: Answer[]
): ContingencyTable | null {
  // Create map for quick lookup
  const answers2Map = new Map<string, Answer>();
  answers2.forEach(answer => {
    answers2Map.set(answer.response_id, answer);
  });

  // Get unique categories for each question
  const categories1 = new Set<string>();
  const categories2 = new Set<string>();
  const pairs: Array<{ cat1: string; cat2: string }> = [];

  // Build pairs and collect categories
  answers1.forEach(answer1 => {
    const answer2 = answers2Map.get(answer1.response_id);

    if (answer2) {
      const values1 = getCategoricalValues(answer1, question1);
      const values2 = getCategoricalValues(answer2, question2);

      // For checkboxes, we only use the first value to keep it simple
      // (otherwise the contingency table becomes complex)
      if (values1.length > 0 && values2.length > 0) {
        const cat1 = values1[0];
        const cat2 = values2[0];

        categories1.add(cat1);
        categories2.add(cat2);
        pairs.push({ cat1, cat2 });
      }
    }
  });

  // Need at least 2 categories in each question
  if (categories1.size < 2 || categories2.size < 2) {
    return null;
  }

  const rowLabels = Array.from(categories1);
  const columnLabels = Array.from(categories2);

  // Initialize observed frequencies table
  const rows = rowLabels.length;
  const cols = columnLabels.length;
  const observed: number[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  // Count observed frequencies
  pairs.forEach(({ cat1, cat2 }) => {
    const rowIndex = rowLabels.indexOf(cat1);
    const colIndex = columnLabels.indexOf(cat2);

    if (rowIndex >= 0 && colIndex >= 0) {
      observed[rowIndex][colIndex]++;
    }
  });

  // Calculate row and column totals
  const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
  const columnTotals = Array(cols).fill(0);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      columnTotals[col] += observed[row][col];
    }
  }

  const total = rowTotals.reduce((sum, val) => sum + val, 0);

  // Calculate expected frequencies
  const expected: number[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      expected[row][col] = (rowTotals[row] * columnTotals[col]) / total;
    }
  }

  // Convert IDs to labels
  const rowLabelStrings = rowLabels.map(id => getChoiceLabel(id, question1));
  const columnLabelStrings = columnLabels.map(id => getChoiceLabel(id, question2));

  return {
    rowLabels: rowLabelStrings,
    columnLabels: columnLabelStrings,
    observed,
    expected,
    rowTotals,
    columnTotals,
    total,
  };
}

/**
 * Calculate chi-square statistic
 */
function calculateChiSquareStatistic(table: ContingencyTable): number {
  let chiSquare = 0;

  for (let row = 0; row < table.observed.length; row++) {
    for (let col = 0; col < table.observed[0].length; col++) {
      const observed = table.observed[row][col];
      const expected = table.expected[row][col];

      if (expected > 0) {
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }
    }
  }

  return chiSquare;
}

/**
 * Calculate Cramér's V (effect size for chi-square)
 * 0 = no association, 1 = perfect association
 */
function calculateCramersV(chiSquare: number, n: number, rows: number, cols: number): number {
  const minDimension = Math.min(rows - 1, cols - 1);

  if (minDimension === 0 || n === 0) {
    return 0;
  }

  return Math.sqrt(chiSquare / (n * minDimension));
}

/**
 * Approximate p-value using chi-square distribution
 * This is a simplified approximation - for production use a proper stats library
 */
function approximatePValue(chiSquare: number, df: number): number {
  // Very rough approximation based on critical values
  // For more accuracy, use a proper stats library like jStat

  // Common critical values at p=0.05
  const criticalValues: Record<number, number> = {
    1: 3.841,
    2: 5.991,
    3: 7.815,
    4: 9.488,
    5: 11.070,
    6: 12.592,
    7: 14.067,
    8: 15.507,
    9: 16.919,
    10: 18.307,
  };

  // If df is in our lookup table
  if (df in criticalValues) {
    const critical = criticalValues[df];
    if (chiSquare < critical) {
      return 0.1; // Not significant (p > 0.05)
    } else if (chiSquare > critical * 2) {
      return 0.001; // Very significant (p < 0.01)
    } else {
      return 0.03; // Significant (p < 0.05)
    }
  }

  // For other df values, use a rough approximation
  // This is NOT statistically rigorous - just for demonstration
  const expectedMean = df;
  const expectedStd = Math.sqrt(2 * df);

  const zScore = (chiSquare - expectedMean) / expectedStd;

  if (zScore < 1.96) return 0.1; // Not significant
  if (zScore < 2.58) return 0.04; // Significant at p < 0.05
  return 0.005; // Very significant
}

/**
 * Perform chi-square test for independence
 */
export function performChiSquareTest(
  question1: TypedQuestion,
  question2: TypedQuestion,
  answers1: Answer[],
  answers2: Answer[]
): ChiSquareResult | null {
  // Only test categorical questions
  if (!isCategoricalQuestion(question1) || !isCategoricalQuestion(question2)) {
    return null;
  }

  // Build contingency table
  const table = buildContingencyTable(question1, question2, answers1, answers2);

  if (!table) {
    return null;
  }

  // Calculate chi-square statistic
  const chiSquare = calculateChiSquareStatistic(table);

  // Degrees of freedom
  const degreesOfFreedom = (table.rowLabels.length - 1) * (table.columnLabels.length - 1);

  // Calculate p-value (approximation)
  const pValue = approximatePValue(chiSquare, degreesOfFreedom);

  // Calculate Cramér's V (effect size)
  const cramersV = calculateCramersV(
    chiSquare,
    table.total,
    table.rowLabels.length,
    table.columnLabels.length
  );

  // Check significance (p < 0.05)
  const isSignificant = pValue < 0.05;

  return {
    question1,
    question2,
    chiSquare,
    degreesOfFreedom,
    pValue,
    cramersV,
    isSignificant,
    contingencyTable: table,
    sampleSize: table.total,
  };
}

/**
 * Interpret Cramér's V effect size
 */
export function interpretCramersV(cramersV: number): string {
  if (cramersV < 0.1) return 'Negligible';
  if (cramersV < 0.3) return 'Weak';
  if (cramersV < 0.5) return 'Moderate';
  return 'Strong';
}

/**
 * Format p-value for display
 */
export function formatPValue(pValue: number): string {
  if (pValue < 0.001) return '< 0.001';
  if (pValue < 0.01) return '< 0.01';
  if (pValue < 0.05) return '< 0.05';
  return pValue.toFixed(3);
}
