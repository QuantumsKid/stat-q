'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { calculateTrendData } from '@/lib/utils/statistics-engine';

interface TrendChartProps {
  responses: Array<{ started_at: string; submitted_at?: string }>;
}

export function TrendChart({ responses }: TrendChartProps) {
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');

  const trendData = useMemo(() => {
    const submittedDates = responses
      .filter((r) => r.submitted_at)
      .map((r) => r.submitted_at!);

    return calculateTrendData(submittedDates, interval);
  }, [responses, interval]);

  if (trendData.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Response Trend</h3>
        <div className="flex gap-2">
          <Button
            variant={interval === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('day')}
          >
            Daily
          </Button>
          <Button
            variant={interval === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('week')}
          >
            Weekly
          </Button>
          <Button
            variant={interval === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInterval('month')}
          >
            Monthly
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Responses"
            dot={{ fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
