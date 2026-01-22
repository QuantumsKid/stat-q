/**
 * Statistical outlier detection methods
 * Implements IQR and Z-Score methods for identifying outliers
 */

export interface OutlierResult {
  outliers: number[];
  outlierIndices: number[];
  lowerBound: number;
  upperBound: number;
  method: 'iqr' | 'zscore';
  threshold?: number;
}

export interface OutlierSummary {
  count: number;
  percentage: number;
  values: number[];
  method: string;
}

/**
 * Detect outliers using the Interquartile Range (IQR) method
 * More robust to extreme values than z-score
 *
 * @param values - Array of numeric values
 * @param multiplier - IQR multiplier (default 1.5 for outliers, 3.0 for extreme outliers)
 * @returns Outlier detection results
 */
export function detectOutliersIQR(
  values: number[],
  multiplier: number = 1.5
): OutlierResult {
  if (values.length < 4) {
    return {
      outliers: [],
      outlierIndices: [],
      lowerBound: 0,
      upperBound: 0,
      method: 'iqr',
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Calculate bounds
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  // Find outliers
  const outliers: number[] = [];
  const outlierIndices: number[] = [];

  values.forEach((val, idx) => {
    if (val < lowerBound || val > upperBound) {
      outliers.push(val);
      outlierIndices.push(idx);
    }
  });

  return {
    outliers,
    outlierIndices,
    lowerBound: Number(lowerBound.toFixed(2)),
    upperBound: Number(upperBound.toFixed(2)),
    method: 'iqr',
  };
}

/**
 * Detect outliers using the Z-Score method
 * Assumes normal distribution
 *
 * @param values - Array of numeric values
 * @param threshold - Z-score threshold (default 3.0 for p < 0.003)
 * @returns Outlier detection results with z-scores
 */
export function detectOutliersZScore(
  values: number[],
  threshold: number = 3.0
): OutlierResult & { zScores: number[] } {
  if (values.length < 3) {
    return {
      outliers: [],
      outlierIndices: [],
      lowerBound: 0,
      upperBound: 0,
      method: 'zscore',
      threshold,
      zScores: [],
    };
  }

  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Avoid division by zero
  if (stdDev === 0) {
    return {
      outliers: [],
      outlierIndices: [],
      lowerBound: mean,
      upperBound: mean,
      method: 'zscore',
      threshold,
      zScores: values.map(() => 0),
    };
  }

  const outliers: number[] = [];
  const outlierIndices: number[] = [];
  const zScores: number[] = [];

  values.forEach((val, idx) => {
    const zScore = Math.abs((val - mean) / stdDev);
    zScores.push(Number(zScore.toFixed(3)));

    if (zScore > threshold) {
      outliers.push(val);
      outlierIndices.push(idx);
    }
  });

  const lowerBound = mean - threshold * stdDev;
  const upperBound = mean + threshold * stdDev;

  return {
    outliers,
    outlierIndices,
    lowerBound: Number(lowerBound.toFixed(2)),
    upperBound: Number(upperBound.toFixed(2)),
    method: 'zscore',
    threshold,
    zScores,
  };
}

/**
 * Get outlier summary for display
 */
export function getOutlierSummary(
  values: number[],
  method: 'iqr' | 'zscore' = 'iqr'
): OutlierSummary {
  const result = method === 'iqr'
    ? detectOutliersIQR(values)
    : detectOutliersZScore(values);

  const percentage = values.length > 0
    ? (result.outliers.length / values.length) * 100
    : 0;

  return {
    count: result.outliers.length,
    percentage: Number(percentage.toFixed(1)),
    values: result.outliers,
    method: method === 'iqr' ? 'IQR Method' : 'Z-Score Method',
  };
}

/**
 * Check if a value is an outlier
 */
export function isOutlier(
  value: number,
  allValues: number[],
  method: 'iqr' | 'zscore' = 'iqr'
): boolean {
  const result = method === 'iqr'
    ? detectOutliersIQR(allValues)
    : detectOutliersZScore(allValues);

  return result.outliers.includes(value);
}

/**
 * Remove outliers from dataset
 */
export function removeOutliers(
  values: number[],
  method: 'iqr' | 'zscore' = 'iqr'
): number[] {
  const result = method === 'iqr'
    ? detectOutliersIQR(values)
    : detectOutliersZScore(values);

  const outlierSet = new Set(result.outlierIndices);
  return values.filter((_, idx) => !outlierSet.has(idx));
}
