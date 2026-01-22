/**
 * Statistics Engine - Calculates descriptive statistics and analysis for form responses
 * Performs client-side calculations for real-time analytics
 */

import type { Question } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';

export interface DescriptiveStats {
  count: number;
  mean: number | null;
  median: number | null;
  mode: number | string | null;
  min: number | null;
  max: number | null;
  range: number | null;
  variance: number | null;
  stdDev: number | null;
}

export interface FrequencyItem {
  label: string;
  value: string | number;
  count: number;
  percentage: number;
}

export interface FrequencyDistribution {
  items: FrequencyItem[];
  total: number;
}

/**
 * Calculate descriptive statistics for numeric data
 */
export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      mode: null,
      min: null,
      max: null,
      range: null,
      variance: null,
      stdDev: null,
    };
  }

  const count = values.length;
  const sortedValues = [...values].sort((a, b) => a - b);

  // Mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Median
  const median =
    count % 2 === 0
      ? (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2
      : sortedValues[Math.floor(count / 2)];

  // Mode - most frequently occurring value
  const frequency: Record<number, number> = {};
  values.forEach((val) => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(frequency));
  const modes = Object.keys(frequency)
    .filter((key) => frequency[Number(key)] === maxFreq)
    .map(Number);
  // If all values occur with same frequency (uniform distribution), there is no mode
  // Otherwise return the most common value
  const mode = maxFreq === 1 && Object.keys(frequency).length === count ? null : modes[0];

  // Min, Max, Range
  const min = sortedValues[0];
  const max = sortedValues[count - 1];
  const range = max - min;

  // Variance (sample variance with n-1 denominator for unbiased estimate)
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = count > 1
    ? squaredDiffs.reduce((acc, val) => acc + val, 0) / (count - 1)
    : 0;

  // Standard Deviation
  const stdDev = Math.sqrt(variance);

  return {
    count,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    mode,
    min,
    max,
    range,
    variance: Number(variance.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
  };
}

/**
 * Calculate frequency distribution for categorical data
 */
export function calculateFrequencyDistribution(
  values: (string | number)[],
  labels?: Record<string | number, string>
): FrequencyDistribution {
  const frequency: Record<string | number, number> = {};

  values.forEach((val) => {
    const key = String(val);
    frequency[key] = (frequency[key] || 0) + 1;
  });

  const total = values.length;
  const items: FrequencyItem[] = Object.entries(frequency).map(([value, count]) => ({
    label: labels?.[value] || String(value),
    value,
    count,
    percentage: Number(((count / total) * 100).toFixed(1)),
  }));

  // Sort by count descending
  items.sort((a, b) => b.count - a.count);

  return { items, total };
}

/**
 * Extract numeric values from answers for a linear scale question
 */
export function extractLinearScaleValues(answers: Answer[]): number[] {
  return answers
    .map((answer) => {
      const value = answer.value as { scale_value?: number };
      return value?.scale_value;
    })
    .filter((val): val is number => typeof val === 'number');
}

/**
 * Extract choice values from answers for choice questions
 */
export function extractChoiceValues(answers: Answer[]): string[] {
  return answers
    .map((answer) => {
      const value = answer.value as { choice_id?: string };
      return value?.choice_id;
    })
    .filter((val): val is string => typeof val === 'string');
}

/**
 * Extract checkbox values from answers
 */
export function extractCheckboxValues(answers: Answer[]): string[] {
  const allChoices: string[] = [];
  answers.forEach((answer) => {
    const value = answer.value as { choice_ids?: string[] };
    if (value?.choice_ids && Array.isArray(value.choice_ids)) {
      allChoices.push(...value.choice_ids);
    }
  });
  return allChoices;
}

/**
 * Extract text values from answers for text questions
 */
export function extractTextValues(answers: Answer[]): string[] {
  return answers
    .map((answer) => {
      const value = answer.value as { text?: string };
      return value?.text;
    })
    .filter((val): val is string => typeof val === 'string' && val.trim() !== '');
}

/**
 * Calculate cross-tabulation between two questions
 */
export function calculateCrossTab(
  question1Answers: Answer[],
  question2Answers: Answer[],
  responseIds: string[]
): Record<string, Record<string, number>> {
  const crossTab: Record<string, Record<string, number>> = {};

  responseIds.forEach((responseId) => {
    const answer1 = question1Answers.find((a) => a.response_id === responseId);
    const answer2 = question2Answers.find((a) => a.response_id === responseId);

    if (answer1 && answer2) {
      const val1 = String((answer1.value as { choice_id?: string })?.choice_id || '');
      const val2 = String((answer2.value as { choice_id?: string })?.choice_id || '');

      if (val1 && val2) {
        if (!crossTab[val1]) {
          crossTab[val1] = {};
        }
        crossTab[val1][val2] = (crossTab[val1][val2] || 0) + 1;
      }
    }
  });

  return crossTab;
}

/**
 * Calculate time-series data for trend analysis
 */
export interface TrendDataPoint {
  date: string;
  count: number;
}

export function calculateTrendData(
  submittedDates: string[],
  interval: 'day' | 'week' | 'month' = 'day'
): TrendDataPoint[] {
  const dateCounts: Record<string, number> = {};

  submittedDates.forEach((dateStr) => {
    const date = new Date(dateStr);
    let key: string;

    if (interval === 'day') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (interval === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    dateCounts[key] = (dateCounts[key] || 0) + 1;
  });

  const trendData: TrendDataPoint[] = Object.entries(dateCounts).map(([date, count]) => ({
    date,
    count,
  }));

  // Sort by date
  trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return trendData;
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(totalResponses: number, completedResponses: number): number {
  if (totalResponses === 0) return 0;
  return Number(((completedResponses / totalResponses) * 100).toFixed(1));
}

/**
 * Calculate average completion time in minutes
 */
export function calculateAverageCompletionTime(
  responses: Array<{ started_at: string; submitted_at?: string }>
): number | null {
  const completionTimes: number[] = [];

  responses.forEach((response) => {
    if (response.submitted_at) {
      const start = new Date(response.started_at).getTime();
      const end = new Date(response.submitted_at).getTime();
      const minutes = (end - start) / 1000 / 60;
      if (minutes > 0 && minutes < 1440) {
        // Exclude times over 24 hours
        completionTimes.push(minutes);
      }
    }
  });

  if (completionTimes.length === 0) return null;

  const total = completionTimes.reduce((acc, time) => acc + time, 0);
  return Number((total / completionTimes.length).toFixed(1));
}

/**
 * Get the most common answer for text questions (word cloud data)
 */
export function getMostCommonWords(texts: string[], minLength: number = 3, limit: number = 20): FrequencyItem[] {
  const words: string[] = [];

  texts.forEach((text) => {
    const textWords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length >= minLength);
    words.push(...textWords);
  });

  const frequency = calculateFrequencyDistribution(words);
  return frequency.items.slice(0, limit);
}

/**
 * Extract slider values from answers
 */
export function extractSliderValues(answers: Answer[]): number[] {
  return answers
    .map((answer) => {
      const value = answer.value as { slider_value?: number };
      return value?.slider_value;
    })
    .filter((val): val is number => typeof val === 'number');
}

/**
 * Extract file metadata from answers
 */
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  path?: string;
}

export function extractFileMetadata(answers: Answer[]): FileMetadata[] {
  const allFiles: FileMetadata[] = [];
  answers.forEach((answer) => {
    const value = answer.value as { files?: FileMetadata[] };
    if (value?.files && Array.isArray(value.files)) {
      allFiles.push(...value.files);
    }
  });
  return allFiles;
}

/**
 * Calculate average rank for ranking questions
 */
export interface RankingStats {
  itemId: string;
  itemLabel: string;
  averageRank: number;
  totalRankings: number;
  timesRanked: number;
}

export function calculateRankingStats(
  answers: Answer[],
  items: Array<{ id: string; label: string }>
): RankingStats[] {
  const itemStats: Record<string, { totalRank: number; count: number }> = {};

  // Initialize stats for all items
  items.forEach((item) => {
    itemStats[item.id] = { totalRank: 0, count: 0 };
  });

  // Calculate total ranks
  answers.forEach((answer) => {
    const value = answer.value as { ranked_items?: string[] };
    if (value?.ranked_items && Array.isArray(value.ranked_items)) {
      value.ranked_items.forEach((itemId, index) => {
        if (itemStats[itemId]) {
          itemStats[itemId].totalRank += index + 1; // rank is 1-indexed
          itemStats[itemId].count += 1;
        }
      });
    }
  });

  // Calculate averages
  const stats: RankingStats[] = items.map((item) => {
    const stat = itemStats[item.id];
    return {
      itemId: item.id,
      itemLabel: item.label,
      averageRank: stat.count > 0 ? Number((stat.totalRank / stat.count).toFixed(2)) : 0,
      totalRankings: answers.length,
      timesRanked: stat.count,
    };
  });

  // Sort by average rank (lower rank = better/more preferred)
  stats.sort((a, b) => {
    if (a.timesRanked === 0 && b.timesRanked === 0) return 0;
    if (a.timesRanked === 0) return 1;
    if (b.timesRanked === 0) return -1;
    return a.averageRank - b.averageRank;
  });

  return stats;
}
