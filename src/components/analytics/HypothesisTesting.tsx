'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { independentTTest, oneWayANOVA } from '@/lib/utils/hypothesis-testing';
import type { TypedQuestion } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';

interface HypothesisTestingProps {
  questions: TypedQuestion[];
  answersByQuestion: Record<string, Answer[]>;
}

export function HypothesisTesting({
  questions,
  answersByQuestion,
}: HypothesisTestingProps) {
  const [categoricalQuestionId, setCategoricalQuestionId] = useState<string>('');
  const [numericQuestionId, setNumericQuestionId] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);

  // Filter questions by type
  const categoricalQuestions = useMemo(() => {
    return questions.filter(
      q =>
        q.type === 'multiple_choice' ||
        q.type === 'dropdown' ||
        q.type === 'checkboxes'
    );
  }, [questions]);

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

  // Group numeric values by categorical response
  const groupDataByCategory = (): Record<string, number[]> => {
    if (!categoricalQuestionId || !numericQuestionId) return {};

    const categoricalAnswers = answersByQuestion[categoricalQuestionId] || [];
    const numericAnswers = answersByQuestion[numericQuestionId] || [];

    // Create a map of response_id to categorical value
    const categoryByResponse = new Map<string, string>();
    categoricalAnswers.forEach(answer => {
      if (answer.response_id) {
        const value = Array.isArray(answer.value)
          ? answer.value[0]
          : String(answer.value);
        categoryByResponse.set(answer.response_id, value);
      }
    });

    // Group numeric values by category
    const groups: Record<string, number[]> = {};
    numericAnswers.forEach(answer => {
      if (!answer.response_id) return;

      const category = categoryByResponse.get(answer.response_id);
      if (!category) return;

      const numericValue = extractNumericValue(answer);
      if (numericValue === null) return;

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(numericValue);
    });

    return groups;
  };

  const runHypothesisTest = () => {
    const groups = groupDataByCategory();
    const groupNames = Object.keys(groups);
    const groupValues = Object.values(groups);

    if (groupNames.length < 2) {
      alert('Need at least 2 groups to run hypothesis test');
      return;
    }

    // Filter out groups with less than 2 values
    const validGroups = groupNames.filter(name => groups[name].length >= 2);

    if (validGroups.length < 2) {
      alert('Need at least 2 responses in each group');
      return;
    }

    let result: any;
    if (validGroups.length === 2) {
      // Run independent t-test
      const tTestResult = independentTTest(
        groups[validGroups[0]],
        groups[validGroups[1]],
        0.95
      );

      result = {
        ...tTestResult,
        testType: 't-test',
        groups: validGroups,
      };
    } else {
      // Run one-way ANOVA
      const anovaResult = oneWayANOVA(
        validGroups.map(name => groups[name]),
        0.95
      );

      result = {
        ...anovaResult,
        testType: 'ANOVA',
        groups: validGroups,
      };
    }

    result.groupData = validGroups.map(name => ({
      name,
      values: groups[name],
      count: groups[name].length,
      mean: groups[name].reduce((a, b) => a + b, 0) / groups[name].length,
    }));

    setTestResult(result);
  };

  const categoricalQuestion = questions.find(q => q.id === categoricalQuestionId);
  const numericQuestion = questions.find(q => q.id === numericQuestionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hypothesis Testing
          </CardTitle>
          <CardDescription>
            Compare numeric responses across different categorical groups using statistical tests
            (t-test for 2 groups, ANOVA for 3+ groups)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Question Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categorical Question */}
            <div className="space-y-2">
              <Label htmlFor="categorical-question">
                Categorical Question (Grouping Variable)
              </Label>
              <select
                id="categorical-question"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={categoricalQuestionId}
                onChange={(e) => {
                  setCategoricalQuestionId(e.target.value);
                  setTestResult(null);
                }}
              >
                <option value="">Select a question...</option>
                {categoricalQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Multiple choice, dropdown, or checkbox questions
              </p>
            </div>

            {/* Numeric Question */}
            <div className="space-y-2">
              <Label htmlFor="numeric-question">
                Numeric Question (Dependent Variable)
              </Label>
              <select
                id="numeric-question"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={numericQuestionId}
                onChange={(e) => {
                  setNumericQuestionId(e.target.value);
                  setTestResult(null);
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
                Linear scale or slider questions
              </p>
            </div>
          </div>

          <Button
            onClick={runHypothesisTest}
            disabled={!categoricalQuestionId || !numericQuestionId}
            className="w-full md:w-auto"
          >
            Run Hypothesis Test
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {testResult && (
        <>
          {/* Group Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Statistics</CardTitle>
              <CardDescription>
                Comparing {numericQuestion?.title} across {categoricalQuestion?.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testResult.groupData.map((group: any) => (
                  <div
                    key={group.name}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <h4 className="font-medium text-slate-900 mb-2">
                      {group.name}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sample Size:</span>
                        <span className="font-semibold">{group.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Mean:</span>
                        <span className="font-semibold">
                          {group.mean.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {testResult.testType === 't-test'
                  ? 'Independent Samples T-Test'
                  : 'One-Way ANOVA'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">
                    {testResult.testType === 't-test' ? 'T-Statistic' : 'F-Statistic'}
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {testResult.testType === 't-test'
                      ? testResult.tStatistic.toFixed(3)
                      : testResult.fStatistic.toFixed(3)}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">P-Value</p>
                  <p className="text-xl font-bold text-purple-700">
                    {testResult.pValue < 0.001
                      ? '< 0.001'
                      : testResult.pValue.toFixed(3)}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-slate-600 mb-1">
                    Degrees of Freedom
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {testResult.testType === 't-test'
                      ? testResult.degreesOfFreedom.toFixed(0)
                      : `${testResult.dfBetween}, ${testResult.dfWithin}`}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-slate-600 mb-1">Effect Size</p>
                  <p className="text-xl font-bold text-green-700">
                    {testResult.effectSize.toFixed(3)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {testResult.testType === 't-test' ? "Cohen's d" : 'η²'}
                  </p>
                </div>
              </div>

              {/* Significance Badge */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  testResult.isSignificant
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      testResult.isSignificant
                        ? 'text-green-600'
                        : 'text-slate-600'
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {testResult.isSignificant
                        ? 'Statistically Significant'
                        : 'Not Statistically Significant'}
                    </h4>
                    <p className="text-sm text-slate-700">
                      {testResult.interpretation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Methodology Note */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600">
                  <strong>Significance Level:</strong> α = 0.05
                  <br />
                  <strong>Null Hypothesis:</strong> There is no difference in means
                  between groups
                  <br />
                  <strong>Alternative Hypothesis:</strong> At least one group mean
                  differs from the others
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!testResult && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              Select questions and run a hypothesis test to see results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
