import type { Answer, ResponseWithAnswers } from '@/lib/types/response.types';
import type { Question, Choice } from '@/lib/types/question.types';

/**
 * Gets the highest selected option for choice-based questions
 * (multiple_choice, checkboxes, dropdown)
 */
export function getHighestSelection(
  answers: Answer[],
  choices: Choice[]
): { choiceId: string; label: string; count: number; percentage: number } | null {
  if (answers.length === 0 || choices.length === 0) {
    return null;
  }

  // Count frequencies for each choice
  const frequencyMap = new Map<string, number>();

  answers.forEach((answer) => {
    const value = answer.value ?? answer.value_json;

    if (!value) return;

    // Handle different answer formats
    if (typeof value === 'object' && value !== null) {
      const answerValue = value as Record<string, unknown>;

      // Single choice (multiple_choice, dropdown)
      if ('choice_id' in answerValue && typeof answerValue.choice_id === 'string') {
        const choiceId = answerValue.choice_id;
        frequencyMap.set(choiceId, (frequencyMap.get(choiceId) || 0) + 1);
      }

      // Multiple choices (checkboxes)
      if ('choice_ids' in answerValue && Array.isArray(answerValue.choice_ids)) {
        answerValue.choice_ids.forEach((choiceId) => {
          if (typeof choiceId === 'string') {
            frequencyMap.set(choiceId, (frequencyMap.get(choiceId) || 0) + 1);
          }
        });
      }
    }
  });

  if (frequencyMap.size === 0) {
    return null;
  }

  // Find the choice with highest frequency
  let maxCount = 0;
  let maxChoiceId = '';

  frequencyMap.forEach((count, choiceId) => {
    if (count > maxCount) {
      maxCount = count;
      maxChoiceId = choiceId;
    }
  });

  const choice = choices.find((c) => c.id === maxChoiceId);
  if (!choice) {
    return null;
  }

  const percentage = (maxCount / answers.length) * 100;

  return {
    choiceId: maxChoiceId,
    label: choice.label,
    count: maxCount,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Groups text responses by respondent email
 */
export interface RespondentTextResponses {
  respondentEmail: string;
  submittedAt: string;
  responses: Array<{
    questionTitle: string;
    questionId: string;
    text: string;
  }>;
}

export function groupTextResponsesByRespondent(
  responses: ResponseWithAnswers[],
  questions: Question[]
): RespondentTextResponses[] {
  // Filter to only text questions
  const textQuestions = questions.filter(
    (q) => q.type === 'short_text' || q.type === 'long_text'
  );

  if (textQuestions.length === 0) {
    return [];
  }

  const textQuestionIds = new Set(textQuestions.map((q) => q.id));

  return responses
    .filter((r) => r.is_complete && r.submitted_at)
    .map((response) => {
      const textAnswers = response.answers.filter((a) =>
        textQuestionIds.has(a.question_id)
      );

      const respondentResponses = textAnswers
        .map((answer) => {
          const question = textQuestions.find((q) => q.id === answer.question_id);
          if (!question) return null;

          const value = answer.value ?? answer.value_json;
          let text = '';

          if (typeof value === 'string') {
            text = value;
          } else if (typeof value === 'object' && value !== null) {
            const answerValue = value as Record<string, unknown>;
            if ('text' in answerValue && typeof answerValue.text === 'string') {
              text = answerValue.text;
            }
          }

          if (!text) return null;

          return {
            questionTitle: question.title,
            questionId: question.id,
            text,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      return {
        respondentEmail: response.respondent_email || 'Anonymous',
        submittedAt: response.submitted_at || response.created_at,
        responses: respondentResponses,
      };
    })
    .filter((r) => r.responses.length > 0); // Only include respondents with text answers
}

/**
 * Calculates the response rate for a specific question
 */
export function calculateQuestionResponseRate(
  answers: Answer[],
  totalResponses: number
): number {
  if (totalResponses === 0) return 0;

  const percentage = (answers.length / totalResponses) * 100;
  return Math.round(percentage * 10) / 10; // Round to 1 decimal
}

/**
 * Gets all choice selections with frequencies for a question
 */
export interface ChoiceFrequency {
  choiceId: string;
  label: string;
  count: number;
  percentage: number;
}

export function getChoiceFrequencies(
  answers: Answer[],
  choices: Choice[]
): ChoiceFrequency[] {
  if (answers.length === 0 || choices.length === 0) {
    return [];
  }

  // Count frequencies for each choice
  const frequencyMap = new Map<string, number>();

  answers.forEach((answer) => {
    const value = answer.value ?? answer.value_json;

    if (!value) return;

    if (typeof value === 'object' && value !== null) {
      const answerValue = value as Record<string, unknown>;

      // Single choice
      if ('choice_id' in answerValue && typeof answerValue.choice_id === 'string') {
        const choiceId = answerValue.choice_id;
        frequencyMap.set(choiceId, (frequencyMap.get(choiceId) || 0) + 1);
      }

      // Multiple choices
      if ('choice_ids' in answerValue && Array.isArray(answerValue.choice_ids)) {
        answerValue.choice_ids.forEach((choiceId) => {
          if (typeof choiceId === 'string') {
            frequencyMap.set(choiceId, (frequencyMap.get(choiceId) || 0) + 1);
          }
        });
      }
    }
  });

  // Create frequency array
  return choices.map((choice) => {
    const count = frequencyMap.get(choice.id) || 0;
    const percentage = answers.length > 0 ? (count / answers.length) * 100 : 0;

    return {
      choiceId: choice.id,
      label: choice.label,
      count,
      percentage: Math.round(percentage * 10) / 10,
    };
  }).sort((a, b) => b.count - a.count); // Sort by count descending
}

/**
 * Extract text responses for a specific question
 */
export interface TextResponse {
  respondentEmail: string;
  text: string;
  submittedAt: string;
  responseId: string;
}

export function getTextResponses(
  answers: Answer[],
  responses: ResponseWithAnswers[]
): TextResponse[] {
  const responseMap = new Map(responses.map((r) => [r.id, r]));

  return answers
    .map((answer) => {
      const response = responseMap.get(answer.response_id);
      if (!response || !response.is_complete) return null;

      const value = answer.value ?? answer.value_json;
      let text = '';

      if (typeof value === 'string') {
        text = value;
      } else if (typeof value === 'object' && value !== null) {
        const answerValue = value as Record<string, unknown>;
        if ('text' in answerValue && typeof answerValue.text === 'string') {
          text = answerValue.text;
        }
      }

      if (!text) return null;

      return {
        respondentEmail: response.respondent_email || 'Anonymous',
        text,
        submittedAt: response.submitted_at || response.created_at,
        responseId: response.id,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}
