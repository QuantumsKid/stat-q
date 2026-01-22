'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import type { TypedQuestion } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';
import {
  calculateCrossTabulation,
  isCategoricalQuestion,
  type CrossTabResult,
  type NumericTargetStats,
  type CategoricalTargetStats,
} from '@/lib/utils/cross-tabulation';
import {
  performChiSquareTest,
  isCategoricalQuestion as isChiSquareCompatible,
  formatPValue,
  interpretCramersV,
  type ChiSquareResult,
} from '@/lib/utils/chi-square';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CrossTabulationProps {
  questions: TypedQuestion[];
  answersByQuestion: Record<string, Answer[]>;
}

export function CrossTabulation({ questions, answersByQuestion }: CrossTabulationProps) {
  const [filterQuestionId, setFilterQuestionId] = useState<string>('');
  const [targetQuestionId, setTargetQuestionId] = useState<string>('');

  // Filter questions suitable for filtering (categorical)
  const filterableQuestions = useMemo(
    () => questions.filter(q => isCategoricalQuestion(q)),
    [questions]
  );

  // Target questions (all except the selected filter)
  const targetableQuestions = useMemo(
    () => questions.filter(q => q.id !== filterQuestionId),
    [questions, filterQuestionId]
  );

  // Calculate cross-tabulation
  const crossTabResult = useMemo<CrossTabResult | null>(() => {
    if (!filterQuestionId || !targetQuestionId) return null;

    const filterQuestion = questions.find(q => q.id === filterQuestionId);
    const targetQuestion = questions.find(q => q.id === targetQuestionId);

    if (!filterQuestion || !targetQuestion) return null;

    return calculateCrossTabulation(filterQuestion, targetQuestion, answersByQuestion);
  }, [filterQuestionId, targetQuestionId, questions, answersByQuestion]);

  // Calculate chi-square test (only for categorical × categorical)
  const chiSquareResult = useMemo<ChiSquareResult | null>(() => {
    if (!filterQuestionId || !targetQuestionId) return null;

    const filterQuestion = questions.find(q => q.id === filterQuestionId);
    const targetQuestion = questions.find(q => q.id === targetQuestionId);

    if (!filterQuestion || !targetQuestion) return null;

    // Only perform chi-square for categorical questions
    if (!isChiSquareCompatible(filterQuestion) || !isChiSquareCompatible(targetQuestion)) {
      return null;
    }

    const filterAnswers = answersByQuestion[filterQuestionId] || [];
    const targetAnswers = answersByQuestion[targetQuestionId] || [];

    return performChiSquareTest(filterQuestion, targetQuestion, filterAnswers, targetAnswers);
  }, [filterQuestionId, targetQuestionId, questions, answersByQuestion]);

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-2 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cross-Tabulation Analysis
        </CardTitle>
        <CardDescription>
          Analyze how responses to one question vary based on answers to another question
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filter Question */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter By (Categorical Question)
            </label>
            <Select value={filterQuestionId} onValueChange={setFilterQuestionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a question to filter by" />
              </SelectTrigger>
              <SelectContent>
                {filterableQuestions.map((question, index) => (
                  <SelectItem key={question.id} value={question.id}>
                    Q{index + 1}: {question.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterableQuestions.length === 0 && (
              <p className="text-sm text-slate-500">
                No categorical questions available (multiple choice, checkboxes, dropdown, or linear scale)
              </p>
            )}
          </div>

          {/* Target Question */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target Question
            </label>
            <Select
              value={targetQuestionId}
              onValueChange={setTargetQuestionId}
              disabled={!filterQuestionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a question to analyze" />
              </SelectTrigger>
              <SelectContent>
                {targetableQuestions.map((question, index) => (
                  <SelectItem key={question.id} value={question.id}>
                    Q{index + 1}: {question.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {crossTabResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold mb-2">Analysis Summary</h3>
              <p className="text-sm text-slate-600">
                Showing how <strong>{crossTabResult.targetQuestion.title}</strong> responses vary by{' '}
                <strong>{crossTabResult.filterQuestion.title}</strong>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Total matched responses: {crossTabResult.totalResponses}
              </p>
            </div>

            {/* Chi-Square Test Results */}
            {chiSquareResult && (
              <div className={`p-4 rounded-lg border-2 ${
                chiSquareResult.isSignificant
                  ? 'bg-green-50 border-green-300'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {chiSquareResult.isSignificant ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-500" />
                    )}
                    <h3 className="font-semibold">Chi-Square Test of Independence</h3>
                  </div>
                  <Badge variant={chiSquareResult.isSignificant ? 'default' : 'secondary'}>
                    {chiSquareResult.isSignificant ? 'Significant' : 'Not Significant'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <p className="text-xs text-slate-500">χ² Statistic</p>
                    <p className="text-lg font-semibold">{chiSquareResult.chiSquare.toFixed(3)}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <p className="text-xs text-slate-500">p-value</p>
                    <p className="text-lg font-semibold">{formatPValue(chiSquareResult.pValue)}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <p className="text-xs text-slate-500">Cramér&apos;s V</p>
                    <p className="text-lg font-semibold">{chiSquareResult.cramersV.toFixed(3)}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <p className="text-xs text-slate-500">Effect Size</p>
                    <p className="text-lg font-semibold">{interpretCramersV(chiSquareResult.cramersV)}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  {chiSquareResult.isSignificant ? (
                    <>
                      <strong>There is a statistically significant relationship</strong> between these two questions
                      (p {formatPValue(chiSquareResult.pValue)}). The effect size is{' '}
                      {interpretCramersV(chiSquareResult.cramersV).toLowerCase()}.
                    </>
                  ) : (
                    <>
                      There is <strong>no statistically significant relationship</strong> between these two questions
                      (p {formatPValue(chiSquareResult.pValue)}). The observed patterns may be due to chance.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Categories */}
            {crossTabResult.categories.map((category) => (
              <div
                key={category.filterValue}
                className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">{category.filterValueLabel}</h4>
                  <span className="text-sm bg-slate-200 px-3 py-1 rounded-full">
                    {category.count} responses
                  </span>
                </div>

                {/* Numeric Stats */}
                {category.targetStats.type === 'numeric' && (
                  <NumericStatsView stats={category.targetStats} />
                )}

                {/* Categorical Stats */}
                {category.targetStats.type === 'categorical' && (
                  <CategoricalStatsView
                    stats={category.targetStats}
                    categoryLabel={category.filterValueLabel}
                  />
                )}

                {/* Text Stats */}
                {category.targetStats.type === 'text' && (
                  <TextStatsView stats={category.targetStats} />
                )}
              </div>
            ))}

            {/* Comparative Chart */}
            {crossTabResult.categories.length > 0 &&
              crossTabResult.categories[0].targetStats.type === 'numeric' && (
                <ComparativeNumericChart
                  categories={crossTabResult.categories
                    .filter((cat): cat is typeof cat & { targetStats: NumericTargetStats } =>
                      cat.targetStats.type === 'numeric'
                    )}
                />
              )}
          </div>
        )}

        {!filterQuestionId && !targetQuestionId && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a filter question and target question to begin cross-tabulation analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component to display numeric statistics
function NumericStatsView({ stats }: { stats: NumericTargetStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatBox label="Mean" value={stats.mean.toFixed(2)} />
      <StatBox label="Median" value={stats.median.toFixed(2)} />
      <StatBox label="Std Dev" value={stats.stdDev.toFixed(2)} />
      <StatBox label="Range" value={`${stats.min} - ${stats.max}`} />
    </div>
  );
}

// Component to display categorical statistics
function CategoricalStatsView({
  stats,
  categoryLabel,
}: {
  stats: CategoricalTargetStats;
  categoryLabel: string;
}) {
  return (
    <div className="space-y-3">
      {stats.distribution.slice(0, 5).map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-slate-500">
              {item.count} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
      {stats.distribution.length > 5 && (
        <p className="text-xs text-slate-500">
          + {stats.distribution.length - 5} more choices
        </p>
      )}
    </div>
  );
}

// Component to display text statistics
function TextStatsView({ stats }: { stats: { sampleResponses: string[]; totalResponses: number } }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {stats.totalResponses} text responses (showing first {Math.min(stats.sampleResponses.length, 3)})
      </p>
      <div className="space-y-2">
        {stats.sampleResponses.slice(0, 3).map((response, idx) => (
          <div
            key={idx}
            className="p-2 bg-white rounded border border-slate-200 text-sm"
          >
            {response.length > 100 ? `${response.substring(0, 100)}...` : response}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat box component
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

// Comparative chart for numeric data
function ComparativeNumericChart({
  categories,
}: {
  categories: Array<{ filterValueLabel: string; targetStats: NumericTargetStats }>;
}) {
  const chartData = categories.map((cat) => ({
    category: cat.filterValueLabel,
    mean: Number(cat.targetStats.mean.toFixed(2)),
    median: Number(cat.targetStats.median.toFixed(2)),
  }));

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <h4 className="font-semibold mb-4">Comparative Statistics</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="mean" fill="#3b82f6" name="Mean" />
          <Bar dataKey="median" fill="#8b5cf6" name="Median" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
