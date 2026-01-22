/**
 * Regression analysis utilities
 * Simple linear regression and related statistics
 */

export interface RegressionResult {
  slope: number;            // β1 coefficient
  intercept: number;        // β0 coefficient
  rSquared: number;         // Coefficient of determination (0-1)
  adjustedRSquared: number; // Adjusted R²
  correlation: number;      // Pearson correlation coefficient
  equation: string;         // Regression equation
  standardError: number;    // Standard error of estimate
  n: number;                // Sample size
  predictions: Array<{
    x: number;
    y: number;
    yPredicted: number;
    residual: number;
  }>;
  residuals: {
    values: number[];
    mean: number;
    standardDeviation: number;
  };
  interpretation: string;
}

/**
 * Calculate simple linear regression
 * Fits a line y = mx + b to the data
 *
 * @param x - Independent variable values
 * @param y - Dependent variable values
 * @returns Regression analysis results
 */
export function simpleLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  if (x.length !== y.length) {
    throw new Error('x and y must have the same length');
  }

  const n = x.length;

  if (n < 3) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      adjustedRSquared: 0,
      correlation: 0,
      equation: 'y = 0',
      standardError: 0,
      n,
      predictions: [],
      residuals: { values: [], mean: 0, standardDeviation: 0 },
      interpretation: 'Insufficient data for regression (need at least 3 points)',
    };
  }

  // Calculate sums
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  // Calculate means
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept
  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) {
    return {
      slope: 0,
      intercept: meanY,
      rSquared: 0,
      adjustedRSquared: 0,
      correlation: 0,
      equation: `y = ${meanY.toFixed(2)}`,
      standardError: 0,
      n,
      predictions: [],
      residuals: { values: [], mean: 0, standardDeviation: 0 },
      interpretation: 'No variance in x variable',
    };
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate predictions and residuals
  const predictions = x.map((xVal, i) => {
    const yPredicted = slope * xVal + intercept;
    const residual = y[i] - yPredicted;
    return {
      x: xVal,
      y: y[i],
      yPredicted: Number(yPredicted.toFixed(4)),
      residual: Number(residual.toFixed(4)),
    };
  });

  const residualValues = predictions.map(p => p.residual);

  // Calculate R² (coefficient of determination)
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const ssResidual = predictions.reduce((sum, p) => sum + Math.pow(p.residual, 2), 0);
  const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Calculate adjusted R²
  const adjustedRSquared = n > 2
    ? 1 - ((1 - rSquared) * (n - 1) / (n - 2))
    : rSquared;

  // Calculate correlation coefficient
  const correlation = Math.sqrt(Math.abs(rSquared)) * (slope >= 0 ? 1 : -1);

  // Calculate standard error of estimate
  const standardError = n > 2
    ? Math.sqrt(ssResidual / (n - 2))
    : 0;

  // Residual statistics
  const residualMean = residualValues.reduce((sum, val) => sum + val, 0) / n;
  const residualVariance = residualValues.reduce((sum, val) => sum + Math.pow(val - residualMean, 2), 0) / n;
  const residualStdDev = Math.sqrt(residualVariance);

  // Create equation string
  const slopeStr = slope >= 0 ? slope.toFixed(4) : slope.toFixed(4);
  const interceptStr = intercept >= 0 ? `+ ${intercept.toFixed(4)}` : `- ${Math.abs(intercept).toFixed(4)}`;
  const equation = `y = ${slopeStr}x ${interceptStr}`;

  // Interpretation
  let interpretation = '';
  if (rSquared > 0.9) {
    interpretation = 'Very strong linear relationship. ';
  } else if (rSquared > 0.7) {
    interpretation = 'Strong linear relationship. ';
  } else if (rSquared > 0.5) {
    interpretation = 'Moderate linear relationship. ';
  } else if (rSquared > 0.3) {
    interpretation = 'Weak linear relationship. ';
  } else {
    interpretation = 'Very weak or no linear relationship. ';
  }

  interpretation += `${(rSquared * 100).toFixed(1)}% of variance explained.`;

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    rSquared: Number(rSquared.toFixed(4)),
    adjustedRSquared: Number(adjustedRSquared.toFixed(4)),
    correlation: Number(correlation.toFixed(4)),
    equation,
    standardError: Number(standardError.toFixed(4)),
    n,
    predictions,
    residuals: {
      values: residualValues,
      mean: Number(residualMean.toFixed(4)),
      standardDeviation: Number(residualStdDev.toFixed(4)),
    },
    interpretation,
  };
}

/**
 * Predict y value for a given x using regression model
 */
export function predict(x: number, regression: RegressionResult): number {
  return Number((regression.slope * x + regression.intercept).toFixed(4));
}

/**
 * Calculate prediction interval for a new observation
 * Returns range where a new y value is likely to fall
 */
export function predictionInterval(
  x: number,
  regression: RegressionResult,
  confidenceLevel: number = 0.95
): {
  predicted: number;
  lowerBound: number;
  upperBound: number;
} {
  const predicted = predict(x, regression);

  // Simplified prediction interval
  // For exact intervals, would need t-distribution
  const margin = 1.96 * regression.standardError; // Approximate 95% CI

  return {
    predicted,
    lowerBound: Number((predicted - margin).toFixed(4)),
    upperBound: Number((predicted + margin).toFixed(4)),
  };
}

/**
 * Calculate residual plot data
 * Useful for checking regression assumptions
 */
export function getResidualPlotData(regression: RegressionResult): Array<{
  fitted: number;
  residual: number;
  standardized: number;
}> {
  const residualStdDev = regression.residuals.standardDeviation;

  return regression.predictions.map(p => ({
    fitted: p.yPredicted,
    residual: p.residual,
    standardized: residualStdDev !== 0
      ? Number((p.residual / residualStdDev).toFixed(4))
      : 0,
  }));
}

/**
 * Check for potential outliers in regression (using Cook's distance simplified)
 */
export function identifyRegressionOutliers(regression: RegressionResult): number[] {
  const outlierIndices: number[] = [];
  const residualStdDev = regression.residuals.standardDeviation;

  if (residualStdDev === 0) return [];

  regression.predictions.forEach((p, i) => {
    const standardized = Math.abs(p.residual / residualStdDev);
    // Mark as outlier if standardized residual > 3
    if (standardized > 3) {
      outlierIndices.push(i);
    }
  });

  return outlierIndices;
}

/**
 * Calculate coefficient of variation for predictions
 * Measures relative variability
 */
export function getCoefficientOfVariation(regression: RegressionResult): number {
  const meanY = regression.predictions.reduce((sum, p) => sum + p.y, 0) / regression.n;

  if (meanY === 0) return 0;

  return Number(((regression.standardError / meanY) * 100).toFixed(2));
}
