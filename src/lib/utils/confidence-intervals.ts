/**
 * Confidence interval calculations
 * Supports various confidence levels for population mean estimation
 */

export interface ConfidenceInterval {
  mean: number;
  lowerBound: number;
  upperBound: number;
  marginOfError: number;
  confidenceLevel: number;
  sampleSize: number;
  standardError: number;
}

/**
 * T-distribution critical values table
 * For degrees of freedom (df) from 1 to 30 at 95% confidence level
 */
const T_VALUES_95: Record<number, number> = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
};

/**
 * T-distribution critical values for 90% confidence level
 */
const T_VALUES_90: Record<number, number> = {
  1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015,
  6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812,
  11: 1.796, 12: 1.782, 13: 1.771, 14: 1.761, 15: 1.753,
  16: 1.746, 17: 1.740, 18: 1.734, 19: 1.729, 20: 1.725,
  21: 1.721, 22: 1.717, 23: 1.714, 24: 1.711, 25: 1.708,
  26: 1.706, 27: 1.703, 28: 1.701, 29: 1.699, 30: 1.697,
};

/**
 * T-distribution critical values for 99% confidence level
 */
const T_VALUES_99: Record<number, number> = {
  1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032,
  6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169,
  11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947,
  16: 2.921, 17: 2.898, 18: 2.878, 19: 2.861, 20: 2.845,
  21: 2.831, 22: 2.819, 23: 2.807, 24: 2.797, 25: 2.787,
  26: 2.779, 27: 2.771, 28: 2.763, 29: 2.756, 30: 2.750,
};

/**
 * Get t-value for given degrees of freedom and confidence level
 */
function getTValue(df: number, confidenceLevel: number): number {
  // For large samples (n > 30), use z-values
  if (df > 30) {
    if (confidenceLevel === 0.90) return 1.645;
    if (confidenceLevel === 0.95) return 1.96;
    if (confidenceLevel === 0.99) return 2.576;
    return 1.96; // Default to 95%
  }

  // Use t-distribution for small samples
  let table: Record<number, number>;
  if (confidenceLevel === 0.90) {
    table = T_VALUES_90;
  } else if (confidenceLevel === 0.99) {
    table = T_VALUES_99;
  } else {
    table = T_VALUES_95; // Default to 95%
  }

  return table[df] || table[30] || 1.96;
}

/**
 * Calculate confidence interval for population mean
 *
 * @param values - Array of numeric values
 * @param confidenceLevel - Confidence level (0.90, 0.95, or 0.99)
 * @returns Confidence interval result
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): ConfidenceInterval {
  const n = values.length;

  if (n < 2) {
    return {
      mean: n === 1 ? values[0] : 0,
      lowerBound: 0,
      upperBound: 0,
      marginOfError: 0,
      confidenceLevel,
      sampleSize: n,
      standardError: 0,
    };
  }

  // Calculate mean
  const mean = values.reduce((sum, val) => sum + val, 0) / n;

  // Calculate sample standard deviation (with n-1 for unbiased estimate)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Calculate standard error
  const standardError = stdDev / Math.sqrt(n);

  // Get critical t-value
  const df = n - 1;
  const tValue = getTValue(df, confidenceLevel);

  // Calculate margin of error
  const marginOfError = tValue * standardError;

  // Calculate bounds
  const lowerBound = mean - marginOfError;
  const upperBound = mean + marginOfError;

  return {
    mean: Number(mean.toFixed(2)),
    lowerBound: Number(lowerBound.toFixed(2)),
    upperBound: Number(upperBound.toFixed(2)),
    marginOfError: Number(marginOfError.toFixed(2)),
    confidenceLevel,
    sampleSize: n,
    standardError: Number(standardError.toFixed(4)),
  };
}

/**
 * Calculate multiple confidence intervals at different levels
 */
export function calculateMultipleConfidenceIntervals(
  values: number[]
): {
  ci90: ConfidenceInterval;
  ci95: ConfidenceInterval;
  ci99: ConfidenceInterval;
} {
  return {
    ci90: calculateConfidenceInterval(values, 0.90),
    ci95: calculateConfidenceInterval(values, 0.95),
    ci99: calculateConfidenceInterval(values, 0.99),
  };
}

/**
 * Format confidence interval for display
 */
export function formatConfidenceInterval(ci: ConfidenceInterval): string {
  const level = (ci.confidenceLevel * 100).toFixed(0);
  return `${ci.mean} (${level}% CI: ${ci.lowerBound} - ${ci.upperBound})`;
}

/**
 * Check if two confidence intervals overlap
 * Useful for determining if two groups are significantly different
 */
export function confidenceIntervalsOverlap(
  ci1: ConfidenceInterval,
  ci2: ConfidenceInterval
): boolean {
  return !(ci1.upperBound < ci2.lowerBound || ci2.upperBound < ci1.lowerBound);
}

/**
 * Calculate confidence interval for a proportion
 * Uses Wilson score interval (more accurate than normal approximation)
 */
export function calculateProportionConfidenceInterval(
  successes: number,
  total: number,
  confidenceLevel: number = 0.95
): {
  proportion: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
} {
  if (total === 0) {
    return {
      proportion: 0,
      lowerBound: 0,
      upperBound: 0,
      confidenceLevel,
    };
  }

  const p = successes / total;

  // Z-value for confidence level
  let z: number;
  if (confidenceLevel === 0.90) z = 1.645;
  else if (confidenceLevel === 0.99) z = 2.576;
  else z = 1.96; // 95%

  // Wilson score interval
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));

  return {
    proportion: Number(p.toFixed(4)),
    lowerBound: Number(Math.max(0, center - margin).toFixed(4)),
    upperBound: Number(Math.min(1, center + margin).toFixed(4)),
    confidenceLevel,
  };
}
