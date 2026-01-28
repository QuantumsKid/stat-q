'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from './QuestionRenderer';
import { saveAnswer, submitResponse } from '@/app/(public)/forms/[formId]/submit/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Question } from '@/lib/types/question.types';
import type { FormResponse, AnswerValue } from '@/lib/types/response.types';
import type { LogicEvaluationResult } from '@/lib/types/advanced-logic.types';
import { isConditionallyRequired } from '@/lib/utils/advanced-logic-evaluator';

interface SingleQuestionModeProps {
  form: FormWithQuestions;
  responseId: string;
  visibleQuestions: Question[];
  answers: FormResponse;
  onAnswerChange: (answers: FormResponse) => void;
  advancedLogicResult: LogicEvaluationResult | null;
}

export function SingleQuestionMode({
  form,
  responseId,
  visibleQuestions,
  answers,
  onAnswerChange,
  advancedLogicResult,
}: SingleQuestionModeProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, answers]);

  const handleAnswerChange = async (questionId: string, value: AnswerValue) => {
    // Update local state
    const newAnswers = { ...answers, [questionId]: value };
    onAnswerChange(newAnswers);

    // Clear validation error
    setValidationError(null);

    // Auto-save to database
    await saveAnswer(responseId, questionId, value);
  };

  const validateCurrentQuestion = (): boolean => {
    // Check if question is required (considering conditional logic)
    const isRequired = advancedLogicResult
      ? isConditionallyRequired(currentQuestion.id, advancedLogicResult, currentQuestion.required)
      : currentQuestion.required;

    if (!isRequired) return true;

    const answer = answers[currentQuestion.id];

    if (!answer) {
      setValidationError('This question is required');
      return false;
    }

    // Validate based on question type
    if (currentQuestion.type === 'short_text' || currentQuestion.type === 'long_text') {
      if (!answer.text || answer.text.trim() === '') {
        setValidationError('This question is required');
        return false;
      }
    } else if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'dropdown') {
      if (!answer.choice_id) {
        setValidationError('Please select an option');
        return false;
      }
    } else if (currentQuestion.type === 'checkboxes') {
      if (!answer.choice_ids || answer.choice_ids.length === 0) {
        setValidationError('Please select at least one option');
        return false;
      }
    } else if (currentQuestion.type === 'linear_scale') {
      if (answer.scale_value === undefined || answer.scale_value === null) {
        setValidationError('Please select a value');
        return false;
      }
    } else if (currentQuestion.type === 'date_time') {
      if (!answer.date) {
        setValidationError('Please select a date');
        return false;
      }
    } else if (currentQuestion.type === 'matrix') {
      if (!answer.matrix_values || Object.keys(answer.matrix_values).length === 0) {
        setValidationError('Please answer all rows');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setValidationError(null);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentQuestion()) {
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

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-8 text-center max-w-md">
          <p className="text-slate-600 mb-2">No questions available in this form.</p>
          <p className="text-sm text-slate-500">The form owner needs to add questions before it can be filled out.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Container */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Question Number */}
          <div className="text-sm text-slate-500 mb-4">
            {currentQuestionIndex + 1} of {visibleQuestions.length}
          </div>

          {/* Question */}
          <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-8">
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              value={answers[currentQuestion.id]}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              error={validationError || undefined}
              autoFocus
              advancedLogicResult={advancedLogicResult}
              formId={form.id} // Pass formId here
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              aria-label="Previous question"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                aria-label="Submit form"
              >
                {isSubmitting ? 'Submitting...' : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg" aria-label="Next question">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Keyboard Hint */}
          <div className="text-center mt-4 text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-200 rounded">Ctrl</kbd> +{' '}
            <kbd className="px-2 py-1 bg-slate-200 rounded">Enter</kbd> to continue
          </div>
        </div>
      </main>

      {/* Form Title (Footer) */}
      <div className="text-center pb-8">
        <p className="text-sm text-slate-500">{form.title}</p>
      </div>
    </div>
  );
}
