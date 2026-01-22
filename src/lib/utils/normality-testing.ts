/**
 * Normality testing and distribution analysis
 * Tests whether data follows a normal distribution
 */

export interface NormalityTestResult {
  skewness: number;
  kurtosis: number;
  isNormal: boolean;
  interpretation: string;
  sampleSize: number;
  mean: number;
  median: number;
  stdDev: number;
}

/**
 * Calculate skewness (measure of asymmetry)
 * Skewness = 0: symmetric
 * Skewness > 0: right-skewed (tail on right)
 * Skewness < 0: left-skewed (tail on left)
 *
 * @param values - Array of numeric values
 * @returns Skewness coefficient
 */
export function calculateSkewness(values: number[]): number {
  const n = values.length;

  if (n < 3) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const m3 = values.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n;
  const skewness = m3 / Math.pow(stdDev, 3);

  return Number(skewness.toFixed(4));
}

/**
 * Calculate kurtosis (measure of tailedness)
 * Kurtosis = 3: normal distribution (mesokurtic)
 * Kurtosis > 3: heavy tails (leptokurtic)
 * Kurtosis < 3: light tails (platykurtic)
 * We return excess kurtosis (kurtosis - 3)
 *
 * @param values - Array of numeric values
 * @returns Excess kurtosis coefficient
 */
export function calculateKurtosis(values: number[]): number {
  const n = values.length;

  if (n < 4) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const m4 = values.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n;
  const kurtosis = (m4 / Math.pow(stdDev, 4)) - 3; // Excess kurtosis

  return Number(kurtosis.toFixed(4));
}

/**
 * Test normality using skewness and kurtosis
 * Combined test based on acceptable ranges
 *
 * @param values - Array of numeric values
 * @returns Normality test results
 */
export function testNormality(values: number[]): NormalityTestResult {
  const n = values.length;

  if (n < 3) {
    return {
      skewness: 0,
      kurtosis: 0,
      isNormal: false,
      interpretation: 'Insufficient data for normality testing (need at least 3 values)',
      sampleSize: n,
      mean: 0,
      median: 0,
      stdDev: 0,
    };
  }

  // Calculate basic statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Calculate skewness and kurtosis
  const skewness = calculateSkewness(values);
  const kurtosis = calculateKurtosis(values);

  // Normality assessment
  // Generally, data is considered approximately normal if:
  // - Skewness is between -2 and +2
  // - Kurtosis (excess) is between -2 and +2
  const skewnessNormal = Math.abs(skewness) < 2;
  const kurtosisNormal = Math.abs(kurtosis) < 2;
  const isNormal = skewnessNormal && kurtosisNormal;

  // Interpretation
  let interpretation = '';

  // Skewness interpretation
  if (Math.abs(skewness) < 0.5) {
    interpretation += 'Approximately symmetric distribution. ';
  } else if (skewness > 0) {
    if (skewness > 1) {
      interpretation += 'Highly right-skewed (long tail on right). ';
    } else {
      interpretation += 'Moderately right-skewed. ';
    }
  } else {
    if (skewness < -1) {
      interpretation += 'Highly left-skewed (long tail on left). ';
    } else {
      interpretation += 'Moderately left-skewed. ';
    }
  }

  // Kurtosis interpretation
  if (Math.abs(kurtosis) < 0.5) {
    interpretation += 'Normal tailedness. ';
  } else if (kurtosis > 0) {
    if (kurtosis > 1) {
      interpretation += 'Heavy tails (more outliers than normal). ';
    } else {
      interpretation += 'Slightly heavy tails. ';
    }
  } else {
    if (kurtosis < -1) {
      interpretation += 'Light tails (fewer outliers than normal). ';
    } else {
      interpretation += 'Slightly light tails. ';
    }
  }

  // Overall assessment
  if (isNormal) {
    interpretation += 'Data appears approximately normally distributed.';
  } else {
    interpretation += 'Data deviates from normal distribution.';
  }

  return {
    skewness: Number(skewness.toFixed(4)),
    kurtosis: Number(kurtosis.toFixed(4)),
    isNormal,
    interpretation,
    sampleSize: n,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
  };
}

/**
 * Anderson-Darling test for normality (simplified)
 * More powerful than Shapiro-Wilk for large samples
 * Returns approximate test statistic
 */
export function andersonDarlingTest(values: number[]): {
  statistic: number;
  isNormal: boolean;
  interpretation: string;
} {
  const n = values.length;

  if (n < 5) {
    return {
      statistic: 0,
      isNormal: false,
      interpretation: 'Insufficient data for Anderson-Darling test',
    };
  }

  // Standardize values
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return {
      statistic: 0,
      isNormal: false,
      interpretation: 'No variance in data',
    };
  }

  const standardized = values.map(v => (v - mean) / stdDev);
  const sorted = [...standardized].sort((a, b) => a - b);

  // Simplified A-D statistic calculation
  // Full implementation requires cumulative normal distribution function
  // This is an approximation
  let sum = 0;
  for (let i = 0; i < n; i++) {
    // Approximate CDF using error function approximation
    const z = sorted[i];
    const cdf = approximateNormalCDF(z);
    const term = (2 * i + 1) * (Math.log(cdf) + Math.log(1 - approximateNormalCDF(sorted[n - 1 - i])));
    sum += term;
  }

  const statistic = -n - sum / n;

  // Critical value for α = 0.05 is approximately 0.752
  const isNormal = statistic < 0.752;

  const interpretation = isNormal
    ? `Data appears normally distributed (A² = ${statistic.toFixed(4)} < 0.752)`
    : `Data deviates from normality (A² = ${statistic.toFixed(4)} ≥ 0.752)`;

  return {
    statistic: Number(statistic.toFixed(4)),
    isNormal,
    interpretation,
  };
}

/**
 * Approximate cumulative normal distribution function
 * Using error function approximation
 */
function approximateNormalCDF(z: number): number {
  // Approximate using error function
  // This is a simplified approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - p : p;
}

/**
 * Q-Q plot data generation
 * Compares sample quantiles to theoretical normal quantiles
 */
export function generateQQPlotData(values: number[]): Array<{
  theoretical: number;
  sample: number;
}> {
  const n = values.length;

  if (n === 0) return [];

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);

  // Standardize
  const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
  const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Generate Q-Q plot points
  return sorted.map((value, i) => {
    // Sample quantile (standardized)
    const sampleQuantile = stdDev !== 0 ? (value - mean) / stdDev : 0;

    // Theoretical normal quantile (approximate)
    const p = (i + 0.5) / n; // Probability point
    const theoreticalQuantile = approximateNormalQuantile(p);

    return {
      theoretical: Number(theoreticalQuantile.toFixed(4)),
      sample: Number(sampleQuantile.toFixed(4)),
    };
  });
}

/**
 * Approximate normal quantile function (inverse CDF)
 * For Q-Q plots
 */
function approximateNormalQuantile(p: number): number {
  // Beasley-Springer-Moro algorithm (simplified)
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  // Coefficients
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
    0.0276438810333863, 0.0038405729373609, 0.0003951896511919,
    0.0000321767881768, 0.0000002888167364, 0.0000003960315187];

  const y = p - 0.5;

  if (Math.abs(y) < 0.42) {
    const r = y * y;
    let x = y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]);
    x /= ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1);
    return x;
  }

  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));

  let x = c[0];
  for (let i = 1; i < c.length; i++) {
    x += c[i] * Math.pow(r, i);
  }

  if (y < 0) x = -x;

  return x;
}
