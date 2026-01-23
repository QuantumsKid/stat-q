'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';
import {
  calculateDescriptiveStats,
  calculateFrequencyDistribution,
  extractLinearScaleValues,
  extractChoiceValues,
  extractCheckboxValues,
  extractTextValues,
  getMostCommonWords,
  extractSliderValues,
  extractFileMetadata,
  calculateRankingStats,
} from '@/lib/utils/statistics-engine';
import { calculateConfidenceInterval, formatConfidenceInterval } from '@/lib/utils/confidence-intervals';
import { calculateQuartiles } from '@/lib/utils/quartile-analysis';
import { getOutlierSummary } from '@/lib/utils/outlier-detection';
import { testNormality } from '@/lib/utils/normality-testing';

interface QuestionAnalyticsProps {
  question: Question;
  questionNumber: number;
  answers: Answer[];
  totalResponses: number;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export function QuestionAnalytics({
  question,
  questionNumber,
  answers,
  totalResponses,
}: QuestionAnalyticsProps) {
  const responseRate = totalResponses > 0
    ? Math.round((answers.length / totalResponses) * 100)
    : 0;

  const renderAnalytics = () => {
    switch (question.type) {
      case 'multiple_choice':
      case 'dropdown': {
        const choiceValues = extractChoiceValues(answers);

        // Create label mapping with type guard
        const labels: Record<string, string> = {};
        if (question.options && 'choices' in question.options && question.options.choices) {
          question.options.choices.forEach((choice) => {
            labels[choice.id] = choice.label;
          });
        }
        labels['other'] = 'Other';

        const distribution = calculateFrequencyDistribution(choiceValues, labels);

        if (distribution.total === 0) {
          return <p className="text-slate-400">No responses yet</p>;
        }

        const chartData = distribution.items.map((item, index) => ({
          name: item.label,
          value: item.count,
          percentage: item.percentage,
          fill: COLORS[index % COLORS.length],
        }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${Math.round((entry.percent || 0) * 100)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="font-medium mb-3">Response Breakdown</h4>
              <div className="space-y-2">
                {distribution.items.map((item) => (
                  <div key={item.value} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge>{item.count}</Badge>
                      <span className="text-sm text-slate-600">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'checkboxes': {
        const choiceValues = extractCheckboxValues(answers);

        const labels: Record<string, string> = {};
        if (question.options && 'choices' in question.options && question.options.choices) {
          question.options.choices.forEach((choice) => {
            labels[choice.id] = choice.label;
          });
        }
        labels['other'] = 'Other';

        const distribution = calculateFrequencyDistribution(choiceValues, labels);

        if (distribution.total === 0) {
          return <p className="text-slate-400">No responses yet</p>;
        }

        const chartData = distribution.items.map((item, index) => ({
          name: item.label,
          count: item.count,
          fill: COLORS[index % COLORS.length],
        }));

        return (
          <div>
            <h4 className="font-medium mb-3">Selection Frequency</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                <YAxis tick={{ fill: 'currentColor' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'linear_scale': {
        const scaleValues = extractLinearScaleValues(answers);
        const stats = calculateDescriptiveStats(scaleValues);

        if (stats.count === 0) {
          return <p className="text-slate-400">No responses yet</p>;
        }

        // Calculate advanced statistics
        const ci = calculateConfidenceInterval(scaleValues, 0.95);
        const quartiles = calculateQuartiles(scaleValues);
        const outliers = getOutlierSummary(scaleValues, 'iqr');
        const normality = testNormality(scaleValues);

        const distribution = calculateFrequencyDistribution(scaleValues);
        const chartData = distribution.items.map((item, index) => ({
          value: Number(item.value),
          count: item.count,
          fill: COLORS[index % COLORS.length],
        })).sort((a, b) => a.value - b.value);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="value" tick={{ fill: 'currentColor' }} />
                    <YAxis tick={{ fill: 'currentColor' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-medium mb-3">Descriptive Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Mean</p>
                    <p className="text-2xl font-bold">{stats.mean}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      95% CI: {ci.lowerBound} - {ci.upperBound}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Median</p>
                    <p className="text-2xl font-bold">{stats.median}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Mode</p>
                    <p className="text-2xl font-bold">{stats.mode ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Std Dev</p>
                    <p className="text-2xl font-bold">{stats.stdDev}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Min</p>
                    <p className="text-2xl font-bold">{stats.min}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Max</p>
                    <p className="text-2xl font-bold">{stats.max}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quartiles Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Quartiles & Distribution</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">Q1 (25th)</p>
                  <p className="text-xl font-bold text-blue-700">{quartiles.q1}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">Q2 (Median)</p>
                  <p className="text-xl font-bold text-blue-700">{quartiles.q2}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">Q3 (75th)</p>
                  <p className="text-xl font-bold text-blue-700">{quartiles.q3}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">IQR</p>
                  <p className="text-xl font-bold text-blue-700">{quartiles.iqr}</p>
                </div>
              </div>
            </div>

            {/* Outliers & Normality Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t pt-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h5 className="font-medium text-sm mb-2 text-amber-900">Outlier Detection</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Count:</span>
                    <span className="font-semibold text-amber-700">
                      {outliers.count} ({outliers.percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Method:</span>
                    <span className="text-sm">{outliers.method}</span>
                  </div>
                  {outliers.count > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Outlier values: {outliers.values.slice(0, 5).join(', ')}
                      {outliers.values.length > 5 && '...'}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-sm mb-2 text-green-900">Normality Test</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Skewness:</span>
                    <span className="font-semibold">{normality.skewness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Kurtosis:</span>
                    <span className="font-semibold">{normality.kurtosis}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${normality.isNormal ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {normality.isNormal ? '✓ Normal' : '! Non-normal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {normality.interpretation.split('.')[0]}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'short_text':
      case 'long_text': {
        const textValues = extractTextValues(answers);

        if (textValues.length === 0) {
          return <p className="text-slate-400">No responses yet</p>;
        }

        const commonWords = getMostCommonWords(textValues, 3, 15);

        return (
          <div>
            <h4 className="font-medium mb-3">Most Common Words</h4>
            <div className="flex flex-wrap gap-2">
              {commonWords.map((word) => (
                <Badge key={word.value} variant="outline" className="text-sm">
                  {word.label} ({word.count})
                </Badge>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Sample Responses</h4>
              <div className="space-y-2">
                {textValues.slice(0, 5).map((text, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 rounded-lg text-sm"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <p className="text-slate-400">
            Analytics not available for this question type
          </p>
        );
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {questionNumber}
          </span>
          <div>
            <h3 className="text-lg font-semibold mb-1">{question.title}</h3>
            {question.description && (
              <p className="text-sm text-slate-600">
                {question.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Response Rate</p>
          <p className="text-2xl font-bold">{responseRate}%</p>
          <p className="text-xs text-slate-500">
            {answers.length} / {totalResponses} responses
          </p>
        </div>
      </div>

      {renderAnalytics()}
    </div>
  );
}
