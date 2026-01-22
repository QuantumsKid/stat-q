/**
 * Response velocity and timing analysis
 * Analyzes response patterns over time
 */

export interface VelocityAnalysis {
  responsesPerHour: number;
  responsesPerDay: number;
  peakHour: number | null;
  peakDay: string | null;
  peakDayOfWeek: string | null;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: 'strong' | 'moderate' | 'weak';
  velocityByHour: Array<{ hour: number; count: number; dayOfWeek?: string }>;
  velocityByDay: Array<{ day: string; count: number }>;
  velocityByDayOfWeek: Array<{ dayOfWeek: string; count: number; average: number }>;
  firstResponseDate: string | null;
  lastResponseDate: string | null;
  totalDuration: number; // in hours
}

/**
 * Calculate total hours between first and last response
 */
function calculateTotalHours(dates: string[]): number {
  if (dates.length === 0) return 0;

  const timestamps = dates.map(d => new Date(d).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);

  return (max - min) / (1000 * 60 * 60); // Convert ms to hours
}

/**
 * Detect trend using simple linear regression on daily counts
 */
function detectTrend(counts: number[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
} {
  if (counts.length < 3) {
    return { trend: 'stable', strength: 'weak' };
  }

  // Simple linear regression
  const n = counts.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = counts;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Calculate R² for trend strength
  const meanY = sumY / n;
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const predictions = x.map(xi => slope * xi + (sumY - slope * sumX) / n);
  const ssResidual = y.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0);
  const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Determine trend direction
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.1) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  // Determine strength based on R²
  let strength: 'strong' | 'moderate' | 'weak';
  if (rSquared > 0.7) {
    strength = 'strong';
  } else if (rSquared > 0.4) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  return { trend, strength };
}

/**
 * Get day of week name
 */
function getDayOfWeekName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}

/**
 * Calculate response velocity and timing patterns
 *
 * @param submittedDates - Array of ISO date strings when responses were submitted
 * @returns Velocity analysis results
 */
export function calculateResponseVelocity(
  submittedDates: string[]
): VelocityAnalysis {
  if (submittedDates.length === 0) {
    return {
      responsesPerHour: 0,
      responsesPerDay: 0,
      peakHour: null,
      peakDay: null,
      peakDayOfWeek: null,
      trend: 'stable',
      trendStrength: 'weak',
      velocityByHour: [],
      velocityByDay: [],
      velocityByDayOfWeek: [],
      firstResponseDate: null,
      lastResponseDate: null,
      totalDuration: 0,
    };
  }

  // Group responses by hour, day, and day of week
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};
  const dayOfWeekCounts: Record<number, number> = {};

  submittedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const day = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
  });

  // Find peaks
  const hourEntries = Object.entries(hourCounts).map(([h, c]) => ({ hour: Number(h), count: c }));
  const peakHourEntry = hourEntries.sort((a, b) => b.count - a.count)[0];
  const peakHour = peakHourEntry?.hour ?? null;

  const dayEntries = Object.entries(dayCounts).map(([d, c]) => ({ day: d, count: c }));
  const peakDayEntry = dayEntries.sort((a, b) => b.count - a.count)[0];
  const peakDay = peakDayEntry?.day ?? null;

  const dayOfWeekEntries = Object.entries(dayOfWeekCounts).map(([d, c]) => ({
    dayIndex: Number(d),
    count: c,
  }));
  const peakDayOfWeekEntry = dayOfWeekEntries.sort((a, b) => b.count - a.count)[0];
  const peakDayOfWeek = peakDayOfWeekEntry ? getDayOfWeekName(peakDayOfWeekEntry.dayIndex) : null;

  // Calculate velocities
  const totalHours = calculateTotalHours(submittedDates);
  const uniqueDays = Object.keys(dayCounts).length;

  const responsesPerHour = totalHours > 0 ? submittedDates.length / totalHours : 0;
  const responsesPerDay = uniqueDays > 0 ? submittedDates.length / uniqueDays : 0;

  // Prepare velocity by hour data
  const velocityByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0,
  }));

  // Prepare velocity by day data (sorted chronologically)
  const velocityByDay = Object.keys(dayCounts)
    .sort()
    .map(day => ({
      day,
      count: dayCounts[day],
    }));

  // Prepare velocity by day of week data
  const velocityByDayOfWeek = Array.from({ length: 7 }, (_, dayIndex) => {
    const count = dayOfWeekCounts[dayIndex] || 0;
    const weeksWithData = Math.ceil(uniqueDays / 7);
    const average = weeksWithData > 0 ? count / weeksWithData : 0;

    return {
      dayOfWeek: getDayOfWeekName(dayIndex),
      count,
      average: Number(average.toFixed(2)),
    };
  });

  // Detect trend
  const dayCountsArray = velocityByDay.map(d => d.count);
  const { trend, strength: trendStrength } = detectTrend(dayCountsArray);

  // First and last response dates
  const sortedDates = [...submittedDates].sort();
  const firstResponseDate = sortedDates[0] || null;
  const lastResponseDate = sortedDates[sortedDates.length - 1] || null;

  return {
    responsesPerHour: Number(responsesPerHour.toFixed(2)),
    responsesPerDay: Number(responsesPerDay.toFixed(2)),
    peakHour,
    peakDay,
    peakDayOfWeek,
    trend,
    trendStrength,
    velocityByHour,
    velocityByDay,
    velocityByDayOfWeek,
    firstResponseDate,
    lastResponseDate,
    totalDuration: Number(totalHours.toFixed(2)),
  };
}

/**
 * Calculate response velocity for specific time window
 */
export function calculateVelocityInWindow(
  submittedDates: string[],
  windowHours: number
): {
  count: number;
  velocity: number;
  windowStart: string;
  windowEnd: string;
} {
  if (submittedDates.length === 0 || windowHours <= 0) {
    return {
      count: 0,
      velocity: 0,
      windowStart: '',
      windowEnd: '',
    };
  }

  const sortedDates = [...submittedDates].sort();
  const windowStart = sortedDates[0];
  const windowStartTime = new Date(windowStart).getTime();
  const windowEndTime = windowStartTime + windowHours * 60 * 60 * 1000;
  const windowEnd = new Date(windowEndTime).toISOString();

  const countInWindow = submittedDates.filter(dateStr => {
    const time = new Date(dateStr).getTime();
    return time >= windowStartTime && time < windowEndTime;
  }).length;

  const velocity = countInWindow / windowHours;

  return {
    count: countInWindow,
    velocity: Number(velocity.toFixed(2)),
    windowStart,
    windowEnd,
  };
}

/**
 * Find busiest time periods
 */
export function findBusiestPeriods(
  submittedDates: string[],
  periodHours: number = 1,
  topN: number = 5
): Array<{
  start: string;
  end: string;
  count: number;
  velocity: number;
}> {
  if (submittedDates.length === 0) return [];

  const sortedDates = [...submittedDates].sort();
  const periods: Array<{ start: string; end: string; count: number }> = [];

  // Create sliding windows
  for (let i = 0; i < sortedDates.length; i++) {
    const startTime = new Date(sortedDates[i]).getTime();
    const endTime = startTime + periodHours * 60 * 60 * 1000;

    const count = submittedDates.filter(dateStr => {
      const time = new Date(dateStr).getTime();
      return time >= startTime && time < endTime;
    }).length;

    periods.push({
      start: sortedDates[i],
      end: new Date(endTime).toISOString(),
      count,
    });
  }

  // Sort by count and take top N
  const topPeriods = periods
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map(p => ({
      ...p,
      velocity: Number((p.count / periodHours).toFixed(2)),
    }));

  return topPeriods;
}
