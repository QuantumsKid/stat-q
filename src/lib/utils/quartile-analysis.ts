/**
 * Quartile and percentile analysis
 * Provides detailed distribution statistics
 */

export interface QuartileAnalysis {
  q1: number;          // 25th percentile
  q2: number;          // 50th percentile (median)
  q3: number;          // 75th percentile
  iqr: number;         // Interquartile range (Q3 - Q1)
  min: number;
  max: number;
  range: number;
}

export interface PercentileAnalysis extends QuartileAnalysis {
  p10: number;         // 10th percentile
  p90: number;         // 90th percentile
  p95: number;         // 95th percentile
  p99: number;         // 99th percentile
}

export interface BoxPlotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
  whiskerLow: number;  // Lowest value within 1.5*IQR below Q1
  whiskerHigh: number; // Highest value within 1.5*IQR above Q3
}

/**
 * Calculate a specific percentile from sorted data
 * Uses linear interpolation between closest ranks
 *
 * @param sortedValues - Pre-sorted array of values
 * @param percentile - Percentile to calculate (0-100)
 * @returns Percentile value
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate quartiles (Q1, Q2, Q3) from data
 *
 * @param values - Array of numeric values
 * @returns Quartile analysis results
 */
export function calculateQuartiles(values: number[]): QuartileAnalysis {
  if (values.length === 0) {
    return {
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0,
      min: 0,
      max: 0,
      range: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1 = calculatePercentile(sorted, 25);
  const q2 = calculatePercentile(sorted, 50);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  return {
    q1: Number(q1.toFixed(2)),
    q2: Number(q2.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    range: Number(range.toFixed(2)),
  };
}

/**
 * Calculate extended percentile analysis
 *
 * @param values - Array of numeric values
 * @returns Percentile analysis including quartiles and key percentiles
 */
export function calculatePercentiles(values: number[]): PercentileAnalysis {
  if (values.length === 0) {
    return {
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0,
      min: 0,
      max: 0,
      range: 0,
      p10: 0,
      p90: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const quartiles = calculateQuartiles(values);

  return {
    ...quartiles,
    p10: Number(calculatePercentile(sorted, 10).toFixed(2)),
    p90: Number(calculatePercentile(sorted, 90).toFixed(2)),
    p95: Number(calculatePercentile(sorted, 95).toFixed(2)),
    p99: Number(calculatePercentile(sorted, 99).toFixed(2)),
  };
}

/**
 * Prepare box plot data with outlier detection
 *
 * @param values - Array of numeric values
 * @returns Box plot data structure
 */
export function prepareBoxPlotData(values: number[]): BoxPlotData {
  if (values.length === 0) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      outliers: [],
      whiskerLow: 0,
      whiskerHigh: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const quartiles = calculateQuartiles(values);

  // Calculate whiskers and outliers using 1.5 * IQR rule
  const lowerFence = quartiles.q1 - 1.5 * quartiles.iqr;
  const upperFence = quartiles.q3 + 1.5 * quartiles.iqr;

  const outliers: number[] = [];
  let whiskerLow = quartiles.q1;
  let whiskerHigh = quartiles.q3;

  for (const value of sorted) {
    if (value < lowerFence || value > upperFence) {
      outliers.push(value);
    } else {
      if (value < quartiles.q1) {
        whiskerLow = value;
      }
      if (value > quartiles.q3 && value <= upperFence) {
        whiskerHigh = value;
      }
    }
  }

  // If no values within fences, use min/max
  if (whiskerLow === quartiles.q1) whiskerLow = sorted[0];
  if (whiskerHigh === quartiles.q3) whiskerHigh = sorted[n - 1];

  return {
    min: sorted[0],
    q1: quartiles.q1,
    median: quartiles.q2,
    q3: quartiles.q3,
    max: sorted[n - 1],
    outliers,
    whiskerLow: Number(whiskerLow.toFixed(2)),
    whiskerHigh: Number(whiskerHigh.toFixed(2)),
  };
}

/**
 * Calculate percentile rank of a specific value
 * Returns what percentage of values are below this value
 *
 * @param value - Value to find rank for
 * @param allValues - All values in dataset
 * @returns Percentile rank (0-100)
 */
export function getPercentileRank(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;

  const belowCount = allValues.filter(v => v < value).length;
  const equalCount = allValues.filter(v => v === value).length;

  // Use midpoint method: count all below + half of equal values
  const rank = (belowCount + equalCount / 2) / allValues.length * 100;

  return Number(rank.toFixed(1));
}

/**
 * Get value at specific percentile
 *
 * @param percentile - Percentile to find (0-100)
 * @param values - Array of numeric values
 * @returns Value at that percentile
 */
export function getValueAtPercentile(percentile: number, values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  return Number(calculatePercentile(sorted, percentile).toFixed(2));
}

/**
 * Calculate five-number summary for quick overview
 */
export function getFiveNumberSummary(values: number[]): {
  minimum: number;
  q1: number;
  median: number;
  q3: number;
  maximum: number;
} {
  const quartiles = calculateQuartiles(values);

  return {
    minimum: quartiles.min,
    q1: quartiles.q1,
    median: quartiles.q2,
    q3: quartiles.q3,
    maximum: quartiles.max,
  };
}
