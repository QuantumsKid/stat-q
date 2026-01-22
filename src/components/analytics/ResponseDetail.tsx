'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Question } from '@/lib/types/question.types';

interface ResponseData {
  id: string;
  form_id: string;
  respondent_email: string | null;
  is_complete: boolean;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  answers: Array<{
    id: string;
    response_id: string;
    question_id: string;
    value: unknown;
    created_at: string;
    updated_at: string;
  }>;
}

interface ResponseDetailProps {
  form: FormWithQuestions;
  response: ResponseData;
}

export function ResponseDetail({ form, response }: ResponseDetailProps) {
  const getAnswerDisplay = (question: Question, answerValue: unknown) => {
    if (!answerValue) return <span className="text-slate-400">No answer</span>;

    const value = answerValue as Record<string, unknown>;

    switch (question.type) {
      case 'short_text':
      case 'long_text':
        return <p className="text-slate-900">{String(value.text || '')}</p>;

      case 'multiple_choice':
      case 'dropdown': {
        const choiceId = value.choice_id as string;

        if (choiceId === 'other' && value.other_text) {
          return (
            <div>
              <Badge variant="outline">Other</Badge>
              <p className="text-slate-900 mt-2">{String(value.other_text)}</p>
            </div>
          );
        }

        if (question.options && 'choices' in question.options && question.options.choices) {
          const choice = question.options.choices.find((c) => c.id === choiceId);
          return choice ? (
            <Badge>{choice.label}</Badge>
          ) : (
            <span className="text-slate-400">Unknown option</span>
          );
        }

        return <span className="text-slate-400">Unknown option</span>;
      }

      case 'checkboxes': {
        const choiceIds = value.choice_ids as string[];

        if (!choiceIds || choiceIds.length === 0) {
          return <span className="text-slate-400">No selections</span>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            {choiceIds.map((id) => {
              if (id === 'other' && value.other_text) {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <Badge variant="outline">Other: {String(value.other_text)}</Badge>
                  </div>
                );
              }
              if (question.options && 'choices' in question.options && question.options.choices) {
                const choice = question.options.choices.find((c) => c.id === id);
                return choice ? <Badge key={id}>{choice.label}</Badge> : null;
              }
              return null;
            })}
          </div>
        );
      }

      case 'linear_scale': {
        const scaleValue = value.scale_value as number;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {scaleValue}
            </Badge>
          </div>
        );
      }

      case 'matrix': {
        const matrixValues = value.matrix_values as Record<string, string>;
        if (!matrixValues || Object.keys(matrixValues).length === 0) {
          return <span className="text-slate-400">No answers</span>;
        }

        return (
          <div className="space-y-2">
            {Object.entries(matrixValues).map(([rowId, colId]) => (
              <div key={rowId} className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{rowId}:</span>
                <Badge>{colId}</Badge>
              </div>
            ))}
          </div>
        );
      }

      case 'date_time': {
        const dateValue = value.date as string;
        const timeValue = value.time as string;

        return (
          <div className="space-y-1">
            {dateValue && (
              <p className="text-slate-900">
                Date: {format(new Date(dateValue), 'MMM d, yyyy')}
              </p>
            )}
            {timeValue && (
              <p className="text-slate-900">Time: {timeValue}</p>
            )}
          </div>
        );
      }

      default:
        return <span className="text-slate-400">Unsupported question type</span>;
    }
  };

  const completionTime = response.submitted_at && response.started_at
    ? Math.round(
        (new Date(response.submitted_at).getTime() -
          new Date(response.started_at).getTime()) /
          1000 /
          60
      )
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/forms/${form.id}/responses`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Responses
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        <p className="text-slate-600">Response Details</p>
      </div>

      {/* Response Info Card */}
      <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Respondent</p>
              <p className="font-medium">
                {response.respondent_email || 'Anonymous'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-medium">
                {response.is_complete ? (
                  <Badge>Complete</Badge>
                ) : (
                  <Badge variant="secondary">Incomplete</Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Started</p>
              <p className="font-medium">
                {format(new Date(response.started_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>

          {response.submitted_at && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Submitted</p>
                <p className="font-medium">
                  {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                  {completionTime !== null && (
                    <span className="text-sm text-slate-500 ml-2">
                      ({completionTime} min{completionTime !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        {form.questions.map((question, index) => {
          const answer = response.answers.find((a) => a.question_id === question.id);

          return (
            <div
              key={question.id}
              className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-1">{question.title}</h3>
                  {question.description && (
                    <p className="text-sm text-slate-600 mb-3">
                      {question.description}
                    </p>
                  )}
                  <div className="mt-3">
                    {answer ? (
                      getAnswerDisplay(question, answer.value)
                    ) : (
                      <span className="text-slate-400">Not answered</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
