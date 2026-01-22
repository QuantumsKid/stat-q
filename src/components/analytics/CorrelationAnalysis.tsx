'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Grid3x3 } from 'lucide-react';
import type { TypedQuestion } from '@/lib/types/question.types';
import type { Answer, AnswerValue } from '@/lib/types/response.types';
import {
  calculateCorrelationMatrix,
  getTopCorrelations,
  formatCorrelation,
  getCorrelationColor,
  isNumericQuestion,
  type CorrelationPair,
} from '@/lib/utils/correlation';
import { CorrelationHeatmap } from './CorrelationHeatmap';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  ZAxis,
} from 'recharts';

interface CorrelationAnalysisProps {
  questions: TypedQuestion[];
  answersByQuestion: Record<string, Answer[]>;
}

export function CorrelationAnalysis({ questions, answersByQuestion }: CorrelationAnalysisProps) {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(
    () => calculateCorrelationMatrix(questions, answersByQuestion),
    [questions, answersByQuestion]
  );

  // Get top correlations (minimum weak correlation)
  const topCorrelations = useMemo(
    () => getTopCorrelations(correlationMatrix, 20, 'weak'),
    [correlationMatrix]
  );

  const numericQuestions = questions.filter(isNumericQuestion);

  if (numericQuestions.length < 2) {
    return (
      <Card className="backdrop-blur-sm bg-white/90 border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Correlation Analysis
          </CardTitle>
          <CardDescription>
            Analyze relationships between numeric questions using scatter plots and correlation coefficients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>You need at least 2 numeric questions (linear scale or slider) to perform correlation analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedPair = topCorrelations[selectedPairIndex];

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-2 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Correlation Analysis
        </CardTitle>
        <CardDescription>
          Analyze relationships between numeric questions using Pearson correlation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Numeric Questions"
            value={numericQuestions.length}
            description="Questions with numeric values"
          />
          <StatCard
            label="Correlations Found"
            value={topCorrelations.length}
            description="Weak or stronger relationships"
          />
          <StatCard
            label="Strongest Correlation"
            value={
              topCorrelations.length > 0
                ? formatCorrelation(topCorrelations[0].coefficient)
                : 'N/A'
            }
            description={topCorrelations.length > 0 ? topCorrelations[0].strength : ''}
          />
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="pairs">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pairs" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Correlation Pairs
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Correlation Matrix
            </TabsTrigger>
          </TabsList>

          {/* Pairs View */}
          <TabsContent value="pairs" className="space-y-6">
            {/* Top Correlations List */}
            {topCorrelations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Top Correlations</h3>
                <div className="space-y-2">
                  {topCorrelations.slice(0, 5).map((pair, index) => (
                    <CorrelationPairCard
                      key={`${pair.question1.id}-${pair.question2.id}`}
                      pair={pair}
                      isSelected={index === selectedPairIndex}
                      onClick={() => setSelectedPairIndex(index)}
                    />
                  ))}
                </div>
                {topCorrelations.length > 5 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">View more correlations:</label>
                    <Select
                      value={String(selectedPairIndex)}
                      onValueChange={(value) => setSelectedPairIndex(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {topCorrelations.map((pair, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {pair.question1.title} × {pair.question2.title} ({formatCorrelation(pair.coefficient)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Scatter Plot */}
            {selectedPair && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Scatter Plot</h3>
                <ScatterPlot
                  pair={selectedPair}
                  answersByQuestion={answersByQuestion}
                />
              </div>
            )}

            {topCorrelations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No significant correlations found (all correlations are very weak)</p>
                <p className="text-sm mt-2">Try collecting more responses for better analysis</p>
              </div>
            )}
          </TabsContent>

          {/* Matrix View */}
          <TabsContent value="matrix">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Correlation Matrix Heatmap</h3>
              <CorrelationHeatmap correlationMatrix={correlationMatrix} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

// Correlation pair card
function CorrelationPairCard({
  pair,
  isSelected,
  onClick,
}: {
  pair: CorrelationPair;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon =
    pair.direction === 'positive'
      ? ArrowUpRight
      : pair.direction === 'negative'
      ? ArrowDownRight
      : Minus;

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-300:border-blue-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 flex-shrink-0 ${getCorrelationColor(pair.coefficient)}`} />
            <span className="font-medium text-sm truncate">
              {pair.question1.title}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-slate-500">×</span>
            <span className="text-sm truncate">{pair.question2.title}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`font-bold text-lg ${getCorrelationColor(pair.coefficient)}`}>
            {formatCorrelation(pair.coefficient)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {pair.strength}
          </Badge>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {pair.sampleSize} paired responses
      </div>
    </button>
  );
}

// Scatter plot component
function ScatterPlot({
  pair,
  answersByQuestion,
}: {
  pair: CorrelationPair;
  answersByQuestion: Record<string, Answer[]>;
}) {
  const data = useMemo(() => {
    const answers1 = answersByQuestion[pair.question1.id] || [];
    const answers2 = answersByQuestion[pair.question2.id] || [];

    // Create map for quick lookup
    const answers2Map = new Map<string, Answer>();
    answers2.forEach(answer => {
      answers2Map.set(answer.response_id, answer);
    });

    // Build paired data points
    const points: Array<{ x: number; y: number }> = [];

    answers1.forEach(answer1 => {
      const answer2 = answers2Map.get(answer1.response_id);

      if (answer2) {
        const value1 = answer1.value as AnswerValue;
        const value2 = answer2.value as AnswerValue;

        const x = value1.scale_value ?? value1.slider_value;
        const y = value2.scale_value ?? value2.slider_value;

        if (x !== undefined && y !== undefined) {
          points.push({ x, y });
        }
      }
    });

    return points;
  }, [pair, answersByQuestion]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No paired data available for this correlation</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{pair.question1.title} × {pair.question2.title}</p>
            <p className="text-sm text-slate-500">
              Correlation: {formatCorrelation(pair.coefficient)} ({pair.strength} {pair.direction})
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name={pair.question1.title}>
            <Label value={pair.question1.title} offset={-40} position="insideBottom" />
          </XAxis>
          <YAxis type="number" dataKey="y" name={pair.question2.title}>
            <Label value={pair.question2.title} angle={-90} position="insideLeft" />
          </YAxis>
          <ZAxis range={[50, 50]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg">
                    <p className="text-sm">
                      <strong>{pair.question1.title}:</strong> {payload[0].value}
                    </p>
                    <p className="text-sm">
                      <strong>{pair.question2.title}:</strong> {payload[1].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            data={data}
            fill="#3b82f6"
            fillOpacity={0.6}
            strokeOpacity={0.8}
            stroke="#2563eb"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
