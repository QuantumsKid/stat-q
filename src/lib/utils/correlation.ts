/**
 * Statistical correlation analysis utilities
 */

import type { TypedQuestion } from '../types/question.types';
import type { Answer, AnswerValue } from '../types/response.types';

export interface CorrelationPair {
  question1: TypedQuestion;
  question2: TypedQuestion;
  coefficient: number; // Pearson correlation coefficient (-1 to 1)
  sampleSize: number; // Number of paired responses
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong';
  direction: 'positive' | 'negative' | 'none';
  pValue?: number; // Statistical significance (future enhancement)
}

export interface CorrelationMatrix {
  questions: TypedQuestion[];
  matrix: number[][]; // Correlation coefficients matrix
  pairs: CorrelationPair[];
}

/**
 * Check if a question has numeric values
 */
export function isNumericQuestion(question: TypedQuestion): boolean {
  return question.type === 'linear_scale' || question.type === 'slider';
}

/**
 * Extract numeric value from an answer
 */
function getNumericValue(answer: Answer): number | null {
  const value = answer.value as AnswerValue;

  if (value.scale_value !== undefined) {
    return value.scale_value;
  }

  if (value.slider_value !== undefined) {
    return value.slider_value;
  }

  return null;
}

/**
 * Calculate Pearson correlation coefficient
 * Returns value between -1 (perfect negative correlation) and 1 (perfect positive correlation)
 * 0 indicates no correlation
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;

    covariance += diffX * diffY;
    varianceX += diffX * diffX;
    varianceY += diffY * diffY;
  }

  // Avoid division by zero
  if (varianceX === 0 || varianceY === 0) {
    return 0;
  }

  // Pearson correlation coefficient
  const correlation = covariance / Math.sqrt(varianceX * varianceY);

  return correlation;
}

/**
 * Interpret correlation strength
 */
function interpretCorrelationStrength(coefficient: number): 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong' {
  const abs = Math.abs(coefficient);

  if (abs < 0.2) return 'very weak';
  if (abs < 0.4) return 'weak';
  if (abs < 0.6) return 'moderate';
  if (abs < 0.8) return 'strong';
  return 'very strong';
}

/**
 * Determine correlation direction
 */
function interpretCorrelationDirection(coefficient: number): 'positive' | 'negative' | 'none' {
  if (coefficient > 0.1) return 'positive';
  if (coefficient < -0.1) return 'negative';
  return 'none';
}

/**
 * Get paired numeric values for two questions
 */
function getPairedValues(
  answers1: Answer[],
  answers2: Answer[]
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];

  // Create a map of response_id to answer for question 2
  const answers2Map = new Map<string, Answer>();
  answers2.forEach(answer => {
    answers2Map.set(answer.response_id, answer);
  });

  // For each answer to question 1, find corresponding answer to question 2
  answers1.forEach(answer1 => {
    const answer2 = answers2Map.get(answer1.response_id);

    if (answer2) {
      const value1 = getNumericValue(answer1);
      const value2 = getNumericValue(answer2);

      if (value1 !== null && value2 !== null) {
        x.push(value1);
        y.push(value2);
      }
    }
  });

  return { x, y };
}

/**
 * Calculate correlation between two questions
 */
export function calculateCorrelation(
  question1: TypedQuestion,
  question2: TypedQuestion,
  answers1: Answer[],
  answers2: Answer[]
): CorrelationPair | null {
  // Only calculate for numeric questions
  if (!isNumericQuestion(question1) || !isNumericQuestion(question2)) {
    return null;
  }

  // Get paired values
  const { x, y } = getPairedValues(answers1, answers2);

  // Need at least 3 paired values for meaningful correlation
  if (x.length < 3) {
    return null;
  }

  // Calculate correlation coefficient
  const coefficient = calculatePearsonCorrelation(x, y);

  return {
    question1,
    question2,
    coefficient,
    sampleSize: x.length,
    strength: interpretCorrelationStrength(coefficient),
    direction: interpretCorrelationDirection(coefficient),
  };
}

/**
 * Calculate correlation matrix for all numeric questions
 */
export function calculateCorrelationMatrix(
  questions: TypedQuestion[],
  answersByQuestion: Record<string, Answer[]>
): CorrelationMatrix {
  // Filter to numeric questions only
  const numericQuestions = questions.filter(isNumericQuestion);

  // Initialize matrix with zeros
  const n = numericQuestions.length;
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Calculate all pairwise correlations
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Perfect correlation with itself
        matrix[i][j] = 1;
        continue;
      }

      if (i > j) {
        // Use symmetric property (correlation is symmetric)
        matrix[i][j] = matrix[j][i];
        continue;
      }

      // Calculate correlation
      const q1 = numericQuestions[i];
      const q2 = numericQuestions[j];
      const answers1 = answersByQuestion[q1.id] || [];
      const answers2 = answersByQuestion[q2.id] || [];

      const correlation = calculateCorrelation(q1, q2, answers1, answers2);

      if (correlation) {
        matrix[i][j] = correlation.coefficient;
        pairs.push(correlation);
      } else {
        matrix[i][j] = 0;
      }
    }
  }

  // Sort pairs by absolute correlation (strongest first)
  pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  return {
    questions: numericQuestions,
    matrix,
    pairs,
  };
}

/**
 * Get top correlations (strongest relationships)
 */
export function getTopCorrelations(
  correlationMatrix: CorrelationMatrix,
  limit: number = 10,
  minStrength: 'very weak' | 'weak' | 'moderate' = 'weak'
): CorrelationPair[] {
  const strengthOrder = {
    'very weak': 0,
    'weak': 1,
    'moderate': 2,
    'strong': 3,
    'very strong': 4,
  };

  const minStrengthValue = strengthOrder[minStrength];

  return correlationMatrix.pairs
    .filter(pair => strengthOrder[pair.strength] >= minStrengthValue)
    .slice(0, limit);
}

/**
 * Format correlation coefficient for display
 */
export function formatCorrelation(coefficient: number): string {
  return coefficient.toFixed(3);
}

/**
 * Get correlation color based on strength and direction
 */
export function getCorrelationColor(coefficient: number): string {
  if (coefficient > 0.6) return 'text-green-600';
  if (coefficient > 0.3) return 'text-blue-600';
  if (coefficient > -0.3) return 'text-slate-600';
  if (coefficient > -0.6) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get correlation background color for heatmap
 */
export function getCorrelationHeatmapColor(coefficient: number): string {
  // Positive correlations: shades of blue
  // Negative correlations: shades of red
  // No correlation: white/gray

  if (coefficient > 0.8) return 'rgb(37, 99, 235)'; // Blue-600
  if (coefficient > 0.6) return 'rgb(59, 130, 246)'; // Blue-500
  if (coefficient > 0.4) return 'rgb(96, 165, 250)'; // Blue-400
  if (coefficient > 0.2) return 'rgb(147, 197, 253)'; // Blue-300
  if (coefficient > -0.2) return 'rgb(226, 232, 240)'; // Slate-200
  if (coefficient > -0.4) return 'rgb(252, 165, 165)'; // Red-300
  if (coefficient > -0.6) return 'rgb(248, 113, 113)'; // Red-400
  if (coefficient > -0.8) return 'rgb(239, 68, 68)'; // Red-500
  return 'rgb(220, 38, 38)'; // Red-600
}
