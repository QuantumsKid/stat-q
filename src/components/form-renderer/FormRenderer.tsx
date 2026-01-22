'use client';

import { useState, useEffect } from 'react';
import { SingleQuestionMode } from './SingleQuestionMode';
import { ScrollMode } from './ScrollMode';
import { startResponse } from '@/app/(public)/forms/[formId]/submit/actions';
import { toast } from 'sonner';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { FormResponse } from '@/lib/types/response.types';
import { evaluateLogic } from '@/lib/utils/logic-evaluator';
import { evaluateAdvancedLogic, isConditionallyRequired, getQuestionValue } from '@/lib/utils/advanced-logic-evaluator';
import type { AdvancedLogicRule } from '@/lib/types/advanced-logic.types';

interface FormRendererProps {
  form: FormWithQuestions;
  mode: 'single' | 'scroll';
}

export function FormRenderer({ form, mode }: FormRendererProps) {
  const [responseId, setResponseId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<FormResponse>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize response on mount
  useEffect(() => {
    const initializeResponse = async () => {
      // Check if localStorage is available and working
      let isLocalStorageAvailable = false;
      try {
        localStorage.setItem('_test', '1');
        localStorage.removeItem('_test');
        isLocalStorageAvailable = true;
      } catch (e) {
        toast.error(
          'Local storage is disabled or full. Your progress may not be saved.',
          { duration: 5000 }
        );
      }

      // Check if there's a response ID in localStorage
      const savedResponseId = isLocalStorageAvailable ? localStorage.getItem(`response_${form.id}`) : null;

      if (savedResponseId) {
        setResponseId(savedResponseId);
        // Periodically check if localStorage is still available
        const checkInterval = setInterval(() => {
          try {
            const currentResponseId = localStorage.getItem(`response_${form.id}`);
            if (!currentResponseId) {
              toast.warning(
                'Your progress data was cleared. Please save your work soon to avoid losing answers.',
                { duration: 6000 }
              );
              clearInterval(checkInterval);
            }
          } catch (e) {
            toast.error(
              'Local storage became unavailable. Your progress may not be saved.',
              { duration: 5000 }
            );
            clearInterval(checkInterval);
          }
        }, 30000); // Check every 30 seconds

        // Cleanup interval on unmount
        return () => clearInterval(checkInterval);
      } else {
        // Start a new response
        const result = await startResponse(form.id);

        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          setResponseId(result.data.id);
          if (isLocalStorageAvailable) {
            try {
              localStorage.setItem(`response_${form.id}`, result.data.id);
            } catch (e) {
              toast.warning(
                'Cannot save progress locally. If you refresh, you may lose your answers.',
                { duration: 5000 }
              );
            }
          }
        }
      }

      setIsLoading(false);
    };

    initializeResponse();
  }, [form.id]);

  // Calculate which questions should be hidden based on conditional logic
  const getVisibleQuestions = () => {
    if (!form.questions) return [];

    // Evaluate simple logic rules
    const allSimpleRules = form.questions.flatMap((q) => q.logic_rules || []);
    const hiddenFromSimple = evaluateLogic(allSimpleRules, answers, form.questions);

    // Evaluate advanced logic rules
    const allAdvancedRules = form.questions.flatMap((q) =>
      (q.advanced_logic_rules || []) as AdvancedLogicRule[]
    );
    const advancedResult = evaluateAdvancedLogic(allAdvancedRules, answers, form.questions);

    // Combine results: merge both hidden sets
    const allHiddenIds = new Set([...hiddenFromSimple, ...advancedResult.hiddenQuestionIds]);

    // Filter out hidden questions
    return form.questions.filter((q) => !allHiddenIds.has(q.id));
  };

  const visibleQuestions = getVisibleQuestions();

  // Evaluate advanced logic for additional effects (required, piping, calculations)
  const advancedLogicResult = (() => {
    if (!form.questions) return null;
    const allAdvancedRules = form.questions.flatMap((q) =>
      (q.advanced_logic_rules || []) as AdvancedLogicRule[]
    );
    return evaluateAdvancedLogic(allAdvancedRules, answers, form.questions);
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!responseId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">
            Failed to initialize form. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return mode === 'single' ? (
    <SingleQuestionMode
      form={form}
      responseId={responseId}
      visibleQuestions={visibleQuestions}
      answers={answers}
      onAnswerChange={setAnswers}
      advancedLogicResult={advancedLogicResult}
    />
  ) : (
    <ScrollMode
      form={form}
      responseId={responseId}
      visibleQuestions={visibleQuestions}
      answers={answers}
      onAnswerChange={setAnswers}
      advancedLogicResult={advancedLogicResult}
    />
  );
}
