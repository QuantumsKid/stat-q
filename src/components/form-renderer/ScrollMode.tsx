'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from './QuestionRenderer';
import { saveAnswer, submitResponse } from '@/app/(public)/forms/[formId]/submit/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Question } from '@/lib/types/question.types';
import type { FormResponse, AnswerValue } from '@/lib/types/response.types';
import type { LogicEvaluationResult } from '@/lib/types/advanced-logic.types';
import { isConditionallyRequired } from '@/lib/utils/advanced-logic-evaluator';

interface ScrollModeProps {
  form: FormWithQuestions;
  responseId: string;
  visibleQuestions: Question[];
  answers: FormResponse;
  onAnswerChange: (answers: FormResponse) => void;
  advancedLogicResult: LogicEvaluationResult | null;
}

export function ScrollMode({
  form,
  responseId,
  visibleQuestions,
  answers,
  onAnswerChange,
  advancedLogicResult,
}: ScrollModeProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleAnswerChange = async (questionId: string, value: AnswerValue) => {
    // Update local state
    const newAnswers = { ...answers, [questionId]: value };
    onAnswerChange(newAnswers);

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      const newErrors = { ...validationErrors };
      delete newErrors[questionId];
      setValidationErrors(newErrors);
    }

    // Auto-save to database
    await saveAnswer(responseId, questionId, value);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    visibleQuestions.forEach((question) => {
      // Check if question is required (considering conditional logic)
      const isRequired = advancedLogicResult
        ? isConditionallyRequired(question.id, advancedLogicResult, question.required)
        : question.required;

      if (isRequired) {
        const answer = answers[question.id];

        // Check if answer exists and is not empty
        if (!answer) {
          errors[question.id] = 'This question is required';
        } else {
          // Validate based on question type
          if (question.type === 'short_text' || question.type === 'long_text') {
            if (!answer.text || answer.text.trim() === '') {
              errors[question.id] = 'This question is required';
            }
          } else if (question.type === 'multiple_choice' || question.type === 'dropdown') {
            if (!answer.choice_id) {
              errors[question.id] = 'Please select an option';
            }
          } else if (question.type === 'checkboxes') {
            if (!answer.choice_ids || answer.choice_ids.length === 0) {
              errors[question.id] = 'Please select at least one option';
            }
          } else if (question.type === 'linear_scale') {
            if (answer.scale_value === undefined || answer.scale_value === null) {
              errors[question.id] = 'Please select a value';
            }
          } else if (question.type === 'date_time') {
            if (!answer.date) {
              errors[question.id] = 'Please select a date';
            }
          } else if (question.type === 'matrix') {
            if (!answer.matrix_values || Object.keys(answer.matrix_values).length === 0) {
              errors[question.id] = 'Please answer all rows';
            }
          }
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please answer all required questions');
      // Scroll to first error
      const firstErrorQuestionId = Object.keys(validationErrors)[0];
      const element = document.getElementById(`question-${firstErrorQuestionId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    const result = await submitResponse(responseId);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success('Form submitted successfully!');
      // Clear localStorage
      localStorage.removeItem(`response_${form.id}`);
      // Redirect to thank you page
      router.push(`/forms/${form.id}/thank-you`);
    }
  };

  return (
    <main id="main-content" className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Form Header */}
      <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-8 mb-6">
        <h1 className="text-3xl font-bold mb-3">{form.title}</h1>
        {form.description && (
          <p className="text-slate-600">{form.description}</p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {visibleQuestions.map((question, index) => (
          <div
            key={question.id}
            id={`question-${question.id}`}
            className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6"
          >
            <QuestionRenderer
              question={question}
              questionNumber={index + 1}
              value={answers[question.id]}
              onChange={(value) => handleAnswerChange(question.id, value)}
              error={validationErrors[question.id]}
              advancedLogicResult={advancedLogicResult}
              formId={form.id} // Pass formId here
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>This form is powered by StatQ</p>
      </div>
    </main>
  );
}
