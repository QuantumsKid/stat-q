'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { simpleLinearRegression } from '@/lib/utils/regression-analysis';
import type { TypedQuestion } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';

interface RegressionAnalysisProps {
  questions: TypedQuestion[];
  answersByQuestion: Record<string, Answer[]>;
}

export function RegressionAnalysis({
  questions,
  answersByQuestion,
}: RegressionAnalysisProps) {
  const [xQuestionId, setXQuestionId] = useState<string>('');
  const [yQuestionId, setYQuestionId] = useState<string>('');
  const [regressionResult, setRegressionResult] = useState<any>(null);

  // Filter numeric questions
  const numericQuestions = useMemo(() => {
    return questions.filter(
      q => q.type === 'linear_scale' || q.type === 'slider'
    );
  }, [questions]);

  // Extract numeric values for a given response ID
  const extractNumericValue = (answer: Answer): number | null => {
    if (typeof answer.value === 'number') return answer.value;
    if (typeof answer.value === 'string') {
      const parsed = parseFloat(answer.value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // Collect paired data points
  const collectPairedData = (): { x: number[]; y: number[] } => {
    if (!xQuestionId || !yQuestionId) return { x: [], y: [] };

    const xAnswers = answersByQuestion[xQuestionId] || [];
    const yAnswers = answersByQuestion[yQuestionId] || [];

    // Create maps of response_id to value
    const xMap = new Map<string, number>();
    xAnswers.forEach(answer => {
      if (answer.response_id) {
        const value = extractNumericValue(answer);
        if (value !== null) {
          xMap.set(answer.response_id, value);
        }
      }
    });

    const yMap = new Map<string, number>();
    yAnswers.forEach(answer => {
      if (answer.response_id) {
        const value = extractNumericValue(answer);
        if (value !== null) {
          yMap.set(answer.response_id, value);
        }
      }
    });

    // Collect paired values
    const xValues: number[] = [];
    const yValues: number[] = [];

    xMap.forEach((xVal, responseId) => {
      const yVal = yMap.get(responseId);
      if (yVal !== undefined) {
        xValues.push(xVal);
        yValues.push(yVal);
      }
    });

    return { x: xValues, y: yValues };
  };

  const runRegressionAnalysis = () => {
    const { x, y } = collectPairedData();

    if (x.length < 3) {
      alert('Need at least 3 paired responses to run regression analysis');
      return;
    }

    const result = simpleLinearRegression(x, y);
    setRegressionResult(result);
  };

  const xQuestion = questions.find(q => q.id === xQuestionId);
  const yQuestion = questions.find(q => q.id === yQuestionId);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!regressionResult) return [];

    return regressionResult.dataPoints.map((point: any) => ({
      x: point.x,
      y: point.y,
      predicted: point.predicted,
    }));
  }, [regressionResult]);

  // Prepare regression line data (min to max X values)
  const regressionLineData = useMemo(() => {
    if (!regressionResult) return [];

    const xValues = regressionResult.dataPoints.map((p: any) => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    return [
      { x: minX, y: regressionResult.slope * minX + regressionResult.intercept },
      { x: maxX, y: regressionResult.slope * maxX + regressionResult.intercept },
    ];
  }, [regressionResult]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Regression Analysis
          </CardTitle>
          <CardDescription>
            Analyze the linear relationship between two numeric variables with scatter plot and regression line
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Question Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* X Variable */}
            <div className="space-y-2">
              <Label htmlFor="x-question">
                Independent Variable (X-axis)
              </Label>
              <select
                id="x-question"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={xQuestionId}
                onChange={(e) => {
                  setXQuestionId(e.target.value);
                  setRegressionResult(null);
                }}
              >
                <option value="">Select a question...</option>
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Predictor or explanatory variable
              </p>
            </div>

            {/* Y Variable */}
            <div className="space-y-2">
              <Label htmlFor="y-question">
                Dependent Variable (Y-axis)
              </Label>
              <select
                id="y-question"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={yQuestionId}
                onChange={(e) => {
                  setYQuestionId(e.target.value);
                  setRegressionResult(null);
                }}
              >
                <option value="">Select a question...</option>
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Outcome or response variable
              </p>
            </div>
          </div>

          <Button
            onClick={runRegressionAnalysis}
            disabled={!xQuestionId || !yQuestionId || xQuestionId === yQuestionId}
            className="w-full md:w-auto"
          >
            Run Regression Analysis
          </Button>

          {xQuestionId === yQuestionId && xQuestionId && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Please select two different questions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {regressionResult && (
        <>
          {/* Regression Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regression Statistics</CardTitle>
              <CardDescription>
                {yQuestion?.title} vs. {xQuestion?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Regression Equation */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Regression Equation</h4>
                <p className="text-lg font-mono text-blue-700">
                  y = {regressionResult.slope.toFixed(3)}x {regressionResult.intercept >= 0 ? '+' : ''} {regressionResult.intercept.toFixed(3)}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  For every 1-unit increase in X, Y changes by {regressionResult.slope.toFixed(3)} units
                </p>
              </div>

              {/* Key Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-slate-600 mb-1">R² (Coefficient of Determination)</p>
                  <p className="text-xl font-bold text-green-700">
                    {regressionResult.rSquared.toFixed(4)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(regressionResult.rSquared * 100).toFixed(1)}% of variance explained
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">Correlation (r)</p>
                  <p className="text-xl font-bold text-purple-700">
                    {regressionResult.correlation.toFixed(4)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.abs(regressionResult.correlation) > 0.7
                      ? 'Strong'
                      : Math.abs(regressionResult.correlation) > 0.4
                      ? 'Moderate'
                      : 'Weak'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-slate-600 mb-1">Std Error</p>
                  <p className="text-xl font-bold text-amber-700">
                    {regressionResult.standardError.toFixed(3)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Average prediction error
                  </p>
                </div>

                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-slate-600 mb-1">Sample Size</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {regressionResult.n}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Paired observations
                  </p>
                </div>
              </div>

              {/* Interpretation */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="font-medium text-slate-900 mb-2">Interpretation</h5>
                <p className="text-sm text-slate-700">
                  {regressionResult.rSquared > 0.7 && (
                    <>The model explains a <strong>high proportion</strong> of the variance in {yQuestion?.title}. There is a <strong>strong linear relationship</strong> between the variables.</>
                  )}
                  {regressionResult.rSquared > 0.4 && regressionResult.rSquared <= 0.7 && (
                    <>The model explains a <strong>moderate proportion</strong> of the variance in {yQuestion?.title}. There is a <strong>moderate linear relationship</strong> between the variables.</>
                  )}
                  {regressionResult.rSquared <= 0.4 && (
                    <>The model explains a <strong>small proportion</strong> of the variance in {yQuestion?.title}. The linear relationship is <strong>weak</strong>. Other factors may be more important.</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Plot with Regression Line */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scatter Plot & Regression Line</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={xQuestion?.title}
                    label={{ value: xQuestion?.title, position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={yQuestion?.title}
                    label={{ value: yQuestion?.title, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-slate-300 rounded shadow-lg text-xs">
                            <p><strong>X:</strong> {payload[0].value}</p>
                            <p><strong>Y:</strong> {payload[1].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Data Points"
                    data={scatterData}
                    fill="#3b82f6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!regressionResult && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              Select two numeric variables and run regression analysis to see results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
