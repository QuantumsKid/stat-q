'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, List, BarChart3, TrendingUp, Sparkles, FlaskConical, LineChart } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { QuestionAnalytics } from './QuestionAnalytics';
import { TrendChart } from './TrendChart';
import { CrossTabulation } from './CrossTabulation';
import { CorrelationAnalysis } from './CorrelationAnalysis';
import { HypothesisTesting } from './HypothesisTesting';
import { RegressionAnalysis } from './RegressionAnalysis';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import { asTypedQuestion } from '@/lib/utils/question-type-guards';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Answer } from '@/lib/types/response.types';

interface AnalyticsDashboardProps {
  form: FormWithQuestions;
  answersByQuestion: Record<string, Answer[]>;
  stats: {
    totalResponses: number;
    completedResponses: number;
    incompleteResponses: number;
    responses: Array<{ started_at: string; submitted_at?: string }>;
  };
}

export function AnalyticsDashboard({
  form,
  answersByQuestion,
  stats,
}: AnalyticsDashboardProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    preset: 'all',
  });

  // Convert questions to TypedQuestion for type safety
  const typedQuestions = useMemo(
    () => form.questions.map(asTypedQuestion),
    [form.questions]
  );

  // Filter responses based on date range
  const filteredResponses = useMemo(() => {
    return stats.responses.filter(r => {
      if (!r.submitted_at) return false;
      const date = new Date(r.submitted_at);
      return (!dateRange.startDate || date >= dateRange.startDate) &&
             (!dateRange.endDate || date <= dateRange.endDate);
    });
  }, [stats.responses, dateRange]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const completedFiltered = filteredResponses.filter(r => r.submitted_at).length;
    const totalFiltered = filteredResponses.length;
    const incompleteFiltered = totalFiltered - completedFiltered;

    return {
      totalResponses: totalFiltered,
      completedResponses: completedFiltered,
      incompleteResponses: incompleteFiltered,
      responses: filteredResponses,
    };
  }, [filteredResponses]);

  const handleExportPDF = () => {
    // Will implement PDF export
    alert('PDF export coming soon');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <nav className="flex items-center justify-between mb-6" aria-label="Analytics navigation">
        <div className="flex items-center gap-4">
          <Link href={`/forms/${form.id}/responses`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Responses
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-slate-600">Analytics Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/forms/${form.id}/responses`}>
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" />
              View Responses
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </nav>

      {/* Date Range Filter */}
      <div className="mb-6 flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Date Range Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            {dateRange.preset === 'all'
              ? 'Showing all responses'
              : `Filtered: ${filteredStats.completedResponses} of ${stats.completedResponses} responses`}
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats Cards */}
      <StatsCards stats={filteredStats} />

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full max-w-5xl grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cross-tab" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cross-Tab
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Correlation
          </TabsTrigger>
          <TabsTrigger value="hypothesis" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Hypothesis
          </TabsTrigger>
          <TabsTrigger value="regression" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Regression
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Trend Chart */}
          {filteredStats.completedResponses > 0 && (
            <div>
              <TrendChart responses={filteredStats.responses} />
            </div>
          )}

          {/* Question Analytics */}
          <div className="space-y-6">
            {form.questions.map((question, index) => {
              const answers = answersByQuestion[question.id] || [];

              return (
                <QuestionAnalytics
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  answers={answers}
                  totalResponses={filteredStats.completedResponses}
                />
              );
            })}

            {form.questions.length === 0 && (
              <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-12 text-center">
                <p className="text-slate-600">
                  No questions in this form
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Cross-Tabulation Tab */}
        <TabsContent value="cross-tab">
          <CrossTabulation
            questions={typedQuestions}
            answersByQuestion={answersByQuestion}
          />
        </TabsContent>

        {/* Correlation Analysis Tab */}
        <TabsContent value="correlation">
          <CorrelationAnalysis
            questions={typedQuestions}
            answersByQuestion={answersByQuestion}
          />
        </TabsContent>

        {/* Hypothesis Testing Tab */}
        <TabsContent value="hypothesis">
          <HypothesisTesting
            questions={typedQuestions}
            answersByQuestion={answersByQuestion}
          />
        </TabsContent>

        {/* Regression Analysis Tab */}
        <TabsContent value="regression">
          <RegressionAnalysis
            questions={typedQuestions}
            answersByQuestion={answersByQuestion}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
