'use client';

import { CheckCircle, Clock, XCircle, Timer, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { calculateCompletionRate, calculateAverageCompletionTime } from '@/lib/utils/statistics-engine';
import { calculateResponseVelocity } from '@/lib/utils/response-velocity';

interface StatsCardsProps {
  stats: {
    totalResponses: number;
    completedResponses: number;
    incompleteResponses: number;
    responses: Array<{ started_at: string; submitted_at?: string }>;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const completionRate = calculateCompletionRate(
    stats.totalResponses,
    stats.completedResponses
  );

  const avgCompletionTime = calculateAverageCompletionTime(stats.responses);

  // Calculate response velocity
  const submittedDates = stats.responses
    .filter(r => r.submitted_at)
    .map(r => r.submitted_at as string);

  const velocity = submittedDates.length > 0
    ? calculateResponseVelocity(submittedDates)
    : null;

  const statCards = [
    {
      label: 'Total Responses',
      value: stats.totalResponses,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Completed',
      value: stats.completedResponses,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Incomplete',
      value: stats.incompleteResponses,
      icon: XCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}

      {avgCompletionTime !== null && (
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-100">
              <Timer className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Average Completion Time
              </p>
              <p className="text-2xl font-bold">
                {avgCompletionTime < 1
                  ? '< 1 minute'
                  : avgCompletionTime < 60
                  ? `${Math.round(avgCompletionTime)} minutes`
                  : `${(avgCompletionTime / 60).toFixed(1)} hours`}
              </p>
            </div>
          </div>
        </div>
      )}

      {velocity && (
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Response Velocity</p>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <p className="text-2xl font-bold">
                      {velocity.responsesPerDay.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">responses/day</p>
                  </div>
                  <div className="h-8 w-px bg-slate-300" />
                  <div>
                    <p className="text-lg font-semibold text-slate-700">
                      {velocity.responsesPerHour.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">responses/hour</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Trend Indicator */}
              <div className="text-right">
                <p className="text-xs text-slate-600 mb-1">Trend</p>
                <div className="flex items-center gap-1">
                  {velocity.trend === 'increasing' && (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Increasing
                      </span>
                    </>
                  )}
                  {velocity.trend === 'decreasing' && (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        Decreasing
                      </span>
                    </>
                  )}
                  {velocity.trend === 'stable' && (
                    <>
                      <Minus className="h-5 w-5 text-slate-600" />
                      <span className="text-sm font-medium text-slate-600">
                        Stable
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Peak Time */}
              {velocity.peakHour !== null && (
                <div className="text-right">
                  <p className="text-xs text-slate-600 mb-1">Peak Hour</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {velocity.peakHour}:00
                  </p>
                  <p className="text-xs text-slate-500">
                    {velocity.velocityByHour.find(v => v.hour === velocity.peakHour)?.count || 0} responses
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
