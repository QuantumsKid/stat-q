'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Crown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  getHighestSelection,
  getChoiceFrequencies,
  getTextResponses,
  groupTextResponsesByRespondent,
  calculateQuestionResponseRate,
  type ChoiceFrequency,
} from '@/lib/utils/analytics-helpers';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Answer, ResponseWithAnswers } from '@/lib/types/response.types';

interface NeedsAssessmentViewProps {
  form: FormWithQuestions;
  answersByQuestion: Record<string, Answer[]>;
  responses: ResponseWithAnswers[];
}

export function NeedsAssessmentView({
  form,
  answersByQuestion,
  responses,
}: NeedsAssessmentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const completeResponses = useMemo(
    () => responses.filter((r) => r.is_complete),
    [responses]
  );

  // Summary stats
  const totalResponses = completeResponses.length;
  const dateRange = useMemo(() => {
    if (completeResponses.length === 0) return null;

    const dates = completeResponses
      .filter((r) => r.submitted_at)
      .map((r) => new Date(r.submitted_at!));

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return { minDate, maxDate };
  }, [completeResponses]);

  // Group text responses by respondent
  const textResponsesByRespondent = useMemo(
    () => groupTextResponsesByRespondent(completeResponses, form.questions),
    [completeResponses, form.questions]
  );

  // Filter text responses by search query
  const filteredTextResponses = useMemo(() => {
    if (!searchQuery) return textResponsesByRespondent;

    const query = searchQuery.toLowerCase();
    return textResponsesByRespondent.filter(
      (r) =>
        r.respondentEmail.toLowerCase().includes(query) ||
        r.responses.some((resp) => resp.text.toLowerCase().includes(query))
    );
  }, [textResponsesByRespondent, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Respondents</p>
              <p className="text-3xl font-bold mt-2">{totalResponses}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Completion Rate</p>
              <p className="text-3xl font-bold mt-2">
                {responses.length > 0
                  ? `${((completeResponses.length / responses.length) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Crown className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200">
          <div>
            <p className="text-sm text-slate-600 font-medium">Response Period</p>
            <p className="text-sm font-semibold mt-2">
              {dateRange
                ? `${format(dateRange.minDate, 'MMM d, yyyy')} - ${format(dateRange.maxDate, 'MMM d, yyyy')}`
                : 'No responses yet'}
            </p>
          </div>
        </Card>
      </div>

      {/* Question-by-Question Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Question Analysis</h2>

        {form.questions.map((question, index) => {
          const answers = answersByQuestion[question.id] || [];
          const responseRate = calculateQuestionResponseRate(answers, totalResponses);

          // Choice-based questions
          if (
            (question.type === 'multiple_choice' ||
              question.type === 'checkboxes' ||
              question.type === 'dropdown') &&
            question.options &&
            'choices' in question.options
          ) {
            const frequencies = getChoiceFrequencies(answers, question.options.choices);
            const highest = getHighestSelection(answers, question.options.choices);

            return (
              <Card
                key={question.id}
                className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      Q{index + 1}. {question.title}
                    </h3>
                    {question.description && (
                      <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{responseRate.toFixed(1)}% Response Rate</Badge>
                </div>

                {/* Frequency Table */}
                <div className="space-y-2">
                  {frequencies.map((freq) => {
                    const isHighest = highest && freq.choiceId === highest.choiceId;

                    return (
                      <div
                        key={freq.choiceId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isHighest
                            ? 'bg-green-50 border-green-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {isHighest && <Crown className="h-4 w-4 text-green-600" />}
                          <span
                            className={`font-medium ${isHighest ? 'text-green-900' : 'text-slate-700'}`}
                          >
                            {freq.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Bar visualization */}
                          <div className="w-32 h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isHighest ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${freq.percentage}%` }}
                            />
                          </div>

                          <div className="flex items-baseline gap-2 min-w-[80px]">
                            <span
                              className={`text-lg font-bold ${isHighest ? 'text-green-600' : 'text-slate-900'}`}
                            >
                              {freq.count}
                            </span>
                            <span className="text-sm text-slate-600">({freq.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {highest && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      Most Selected: <span className="font-bold">{highest.label}</span> with{' '}
                      {highest.count} responses ({highest.percentage}%)
                    </p>
                  </div>
                )}
              </Card>
            );
          }

          // Text-based questions
          if (question.type === 'short_text' || question.type === 'long_text') {
            const textResponses = getTextResponses(answers, completeResponses);

            return (
              <Card
                key={question.id}
                className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      Q{index + 1}. {question.title}
                    </h3>
                    {question.description && (
                      <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{responseRate.toFixed(1)}% Response Rate</Badge>
                </div>

                {textResponses.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Respondent</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {textResponses.slice(0, 10).map((resp) => (
                          <TableRow key={resp.responseId}>
                            <TableCell className="font-medium">{resp.respondentEmail}</TableCell>
                            <TableCell className="max-w-md">
                              <p className="line-clamp-2">{resp.text}</p>
                            </TableCell>
                            <TableCell>{format(new Date(resp.submittedAt), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No responses yet</p>
                )}

                {textResponses.length > 10 && (
                  <p className="text-sm text-slate-600 mt-2">
                    Showing 10 of {textResponses.length} responses
                  </p>
                )}
              </Card>
            );
          }

          // Other question types - show basic info
          return (
            <Card
              key={question.id}
              className="p-6 backdrop-blur-sm bg-white/90 border-2 border-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Q{index + 1}. {question.title}
                  </h3>
                  {question.description && (
                    <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-2">
                    Type: {question.type.replace('_', ' ')}
                  </p>
                </div>
                <Badge variant="secondary">
                  {answers.length} {answers.length === 1 ? 'response' : 'responses'}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Text Responses by Respondent */}
      {textResponsesByRespondent.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Text Responses by Respondent</h2>
            <p className="text-sm text-slate-600">
              View all text responses organized by respondent
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email or response text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Respondent Accordion */}
          <Card className="backdrop-blur-sm bg-white/90 border-2 border-slate-200">
            <Accordion type="single" collapsible className="w-full">
              {filteredTextResponses.map((respondent, index) => (
                <AccordionItem key={index} value={`respondent-${index}`}>
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <p className="font-semibold">{respondent.respondentEmail}</p>
                        <p className="text-sm text-slate-600">
                          {respondent.responses.length}{' '}
                          {respondent.responses.length === 1 ? 'response' : 'responses'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {format(new Date(respondent.submittedAt), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      {respondent.responses.map((response, rIndex) => (
                        <div
                          key={rIndex}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <p className="font-medium text-sm text-slate-700 mb-2">
                            {response.questionTitle}
                          </p>
                          <p className="text-slate-900">{response.text}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredTextResponses.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-600">
                  {searchQuery ? 'No responses match your search' : 'No text responses yet'}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {form.questions.length === 0 && (
        <Card className="p-12 backdrop-blur-sm bg-white/90 border-2 border-slate-200 text-center">
          <p className="text-slate-600">No questions in this form</p>
        </Card>
      )}
    </div>
  );
}
