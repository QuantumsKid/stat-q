/**
 * Hypothesis testing methods
 * Includes t-tests and ANOVA for comparing groups
 */

export interface TTestResult {
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
  cohensD: number;          // Effect size
  meanDifference: number;
  mean1: number;
  mean2: number;
  n1: number;
  n2: number;
  interpretation: string;
}

export interface ANOVAResult {
  fStatistic: number;
  pValue: number;
  isSignificant: boolean;
  dfBetween: number;
  dfWithin: number;
  ssBetween: number;
  ssWithin: number;
  msBetween: number;
  msWithin: number;
  etaSquared: number;       // Effect size
  groupCount: number;
  totalN: number;
  groupMeans: number[];
  grandMean: number;
  interpretation: string;
}

/**
 * Approximate p-value from t-statistic
 * Uses simplified approximation - for exact values, use statistical libraries
 */
function approximatePValueFromT(t: number, df: number): number {
  // Very simplified approximation
  // For production, consider using jStat or similar library
  const absT = Math.abs(t);

  // Rough approximations based on common critical values
  if (df < 5) {
    if (absT > 4.60) return 0.01;
    if (absT > 2.78) return 0.05;
    if (absT > 2.13) return 0.10;
    return 0.20;
  } else if (df < 10) {
    if (absT > 3.25) return 0.01;
    if (absT > 2.26) return 0.05;
    if (absT > 1.83) return 0.10;
    return 0.20;
  } else if (df < 30) {
    if (absT > 2.75) return 0.01;
    if (absT > 2.04) return 0.05;
    if (absT > 1.70) return 0.10;
    return 0.20;
  } else {
    // Large sample (use z-distribution approximation)
    if (absT > 2.58) return 0.01;
    if (absT > 1.96) return 0.05;
    if (absT > 1.645) return 0.10;
    return 0.20;
  }
}

/**
 * Approximate p-value from F-statistic
 */
function approximatePValueFromF(f: number, df1: number, df2: number): number {
  // Simplified approximation
  if (f < 1) return 0.50;
  if (f < 2) return 0.20;
  if (f < 3) return 0.10;
  if (f < 4) return 0.05;
  if (f < 7) return 0.01;
  return 0.001;
}

/**
 * Independent samples t-test
 * Tests if two groups have significantly different means
 *
 * @param group1 - First group of values
 * @param group2 - Second group of values
 * @param confidenceLevel - Significance level (default 0.95 for α = 0.05)
 * @returns T-test results
 */
export function independentTTest(
  group1: number[],
  group2: number[],
  confidenceLevel: number = 0.95
): TTestResult {
  const n1 = group1.length;
  const n2 = group2.length;

  if (n1 < 2 || n2 < 2) {
    return {
      tStatistic: 0,
      degreesOfFreedom: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel,
      cohensD: 0,
      meanDifference: 0,
      mean1: 0,
      mean2: 0,
      n1,
      n2,
      interpretation: 'Insufficient data for t-test (need at least 2 values per group)',
    };
  }

  // Calculate means
  const mean1 = group1.reduce((sum, val) => sum + val, 0) / n1;
  const mean2 = group2.reduce((sum, val) => sum + val, 0) / n2;
  const meanDifference = mean1 - mean2;

  // Calculate variances
  const variance1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
  const variance2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

  // Pooled variance
  const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
  const pooledStdDev = Math.sqrt(pooledVariance);

  // Standard error
  const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));

  // T-statistic
  const tStatistic = standardError !== 0 ? meanDifference / standardError : 0;

  // Degrees of freedom
  const df = n1 + n2 - 2;

  // P-value
  const pValue = approximatePValueFromT(tStatistic, df);

  // Effect size (Cohen's d)
  const cohensD = pooledStdDev !== 0 ? meanDifference / pooledStdDev : 0;

  // Significance
  const alpha = 1 - confidenceLevel;
  const isSignificant = pValue < alpha;

  // Interpretation
  let interpretation = '';
  if (isSignificant) {
    interpretation = `Significant difference detected (p < ${alpha}). `;
  } else {
    interpretation = `No significant difference detected (p ≥ ${alpha}). `;
  }

  // Effect size interpretation
  const absD = Math.abs(cohensD);
  if (absD < 0.2) interpretation += 'Negligible effect size.';
  else if (absD < 0.5) interpretation += 'Small effect size.';
  else if (absD < 0.8) interpretation += 'Medium effect size.';
  else interpretation += 'Large effect size.';

  return {
    tStatistic: Number(tStatistic.toFixed(4)),
    degreesOfFreedom: df,
    pValue: Number(pValue.toFixed(4)),
    isSignificant,
    confidenceLevel,
    cohensD: Number(cohensD.toFixed(3)),
    meanDifference: Number(meanDifference.toFixed(2)),
    mean1: Number(mean1.toFixed(2)),
    mean2: Number(mean2.toFixed(2)),
    n1,
    n2,
    interpretation,
  };
}

/**
 * One-way ANOVA (Analysis of Variance)
 * Tests if three or more groups have significantly different means
 *
 * @param groups - Array of groups, each containing numeric values
 * @param confidenceLevel - Significance level (default 0.95 for α = 0.05)
 * @returns ANOVA results
 */
export function oneWayANOVA(
  groups: number[][],
  confidenceLevel: number = 0.95
): ANOVAResult {
  const k = groups.length; // Number of groups

  if (k < 2) {
    return {
      fStatistic: 0,
      pValue: 1,
      isSignificant: false,
      dfBetween: 0,
      dfWithin: 0,
      ssBetween: 0,
      ssWithin: 0,
      msBetween: 0,
      msWithin: 0,
      etaSquared: 0,
      groupCount: k,
      totalN: 0,
      groupMeans: [],
      grandMean: 0,
      interpretation: 'Need at least 2 groups for ANOVA',
    };
  }

  // Filter out empty groups
  const validGroups = groups.filter(g => g.length > 0);
  if (validGroups.length < 2) {
    return {
      fStatistic: 0,
      pValue: 1,
      isSignificant: false,
      dfBetween: 0,
      dfWithin: 0,
      ssBetween: 0,
      ssWithin: 0,
      msBetween: 0,
      msWithin: 0,
      etaSquared: 0,
      groupCount: validGroups.length,
      totalN: 0,
      groupMeans: [],
      grandMean: 0,
      interpretation: 'Need at least 2 non-empty groups for ANOVA',
    };
  }

  const n = validGroups.reduce((sum, group) => sum + group.length, 0); // Total sample size

  // Calculate group means
  const groupMeans = validGroups.map(group =>
    group.reduce((sum, val) => sum + val, 0) / group.length
  );

  // Calculate grand mean
  const allValues = validGroups.flat();
  const grandMean = allValues.reduce((sum, val) => sum + val, 0) / n;

  // Between-groups sum of squares (SSB)
  let ssBetween = 0;
  validGroups.forEach((group, i) => {
    ssBetween += group.length * Math.pow(groupMeans[i] - grandMean, 2);
  });

  // Within-groups sum of squares (SSW)
  let ssWithin = 0;
  validGroups.forEach((group, i) => {
    group.forEach(val => {
      ssWithin += Math.pow(val - groupMeans[i], 2);
    });
  });

  // Degrees of freedom
  const dfBetween = validGroups.length - 1;
  const dfWithin = n - validGroups.length;

  // Mean squares
  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  // F-statistic
  const fStatistic = msWithin !== 0 ? msBetween / msWithin : 0;

  // P-value
  const pValue = approximatePValueFromF(fStatistic, dfBetween, dfWithin);

  // Effect size (eta squared)
  const ssTotal = ssBetween + ssWithin;
  const etaSquared = ssTotal !== 0 ? ssBetween / ssTotal : 0;

  // Significance
  const alpha = 1 - confidenceLevel;
  const isSignificant = pValue < alpha;

  // Interpretation
  let interpretation = '';
  if (isSignificant) {
    interpretation = `Significant difference among groups detected (p < ${alpha}). `;
  } else {
    interpretation = `No significant difference among groups (p ≥ ${alpha}). `;
  }

  // Effect size interpretation
  if (etaSquared < 0.01) interpretation += 'Negligible effect size.';
  else if (etaSquared < 0.06) interpretation += 'Small effect size.';
  else if (etaSquared < 0.14) interpretation += 'Medium effect size.';
  else interpretation += 'Large effect size.';

  return {
    fStatistic: Number(fStatistic.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    isSignificant,
    dfBetween,
    dfWithin,
    ssBetween: Number(ssBetween.toFixed(2)),
    ssWithin: Number(ssWithin.toFixed(2)),
    msBetween: Number(msBetween.toFixed(2)),
    msWithin: Number(msWithin.toFixed(2)),
    etaSquared: Number(etaSquared.toFixed(4)),
    groupCount: validGroups.length,
    totalN: n,
    groupMeans: groupMeans.map(m => Number(m.toFixed(2))),
    grandMean: Number(grandMean.toFixed(2)),
    interpretation,
  };
}

/**
 * Paired samples t-test
 * Tests if paired observations have significantly different means
 *
 * @param before - Values before treatment
 * @param after - Values after treatment
 * @param confidenceLevel - Significance level
 * @returns T-test results
 */
export function pairedTTest(
  before: number[],
  after: number[],
  confidenceLevel: number = 0.95
): TTestResult {
  if (before.length !== after.length) {
    throw new Error('Paired t-test requires equal sample sizes');
  }

  const n = before.length;

  if (n < 2) {
    return {
      tStatistic: 0,
      degreesOfFreedom: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel,
      cohensD: 0,
      meanDifference: 0,
      mean1: 0,
      mean2: 0,
      n1: n,
      n2: n,
      interpretation: 'Insufficient data for paired t-test',
    };
  }

  // Calculate differences
  const differences = before.map((val, i) => val - after[i]);

  // Calculate mean difference
  const meanDifference = differences.reduce((sum, val) => sum + val, 0) / n;

  // Calculate standard deviation of differences
  const variance = differences.reduce((sum, val) => sum + Math.pow(val - meanDifference, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Standard error
  const standardError = stdDev / Math.sqrt(n);

  // T-statistic
  const tStatistic = standardError !== 0 ? meanDifference / standardError : 0;

  // Degrees of freedom
  const df = n - 1;

  // P-value
  const pValue = approximatePValueFromT(tStatistic, df);

  // Effect size (Cohen's d for paired samples)
  const cohensD = stdDev !== 0 ? meanDifference / stdDev : 0;

  // Calculate means
  const mean1 = before.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = after.reduce((sum, val) => sum + val, 0) / n;

  // Significance
  const alpha = 1 - confidenceLevel;
  const isSignificant = pValue < alpha;

  // Interpretation
  let interpretation = '';
  if (isSignificant) {
    interpretation = `Significant difference detected (p < ${alpha}). `;
  } else {
    interpretation = `No significant difference detected (p ≥ ${alpha}). `;
  }

  const absD = Math.abs(cohensD);
  if (absD < 0.2) interpretation += 'Negligible effect size.';
  else if (absD < 0.5) interpretation += 'Small effect size.';
  else if (absD < 0.8) interpretation += 'Medium effect size.';
  else interpretation += 'Large effect size.';

  return {
    tStatistic: Number(tStatistic.toFixed(4)),
    degreesOfFreedom: df,
    pValue: Number(pValue.toFixed(4)),
    isSignificant,
    confidenceLevel,
    cohensD: Number(cohensD.toFixed(3)),
    meanDifference: Number(meanDifference.toFixed(2)),
    mean1: Number(mean1.toFixed(2)),
    mean2: Number(mean2.toFixed(2)),
    n1: n,
    n2: n,
    interpretation,
  };
}
