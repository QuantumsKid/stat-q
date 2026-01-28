'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Response, Answer, AnswerValue } from '@/lib/types/response.types';
import type { Question } from '@/lib/types/question.types';
import { validateAnswer } from '@/lib/validations/answer.validation';

interface FormWithQuestionsData {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  display_mode: 'single' | 'scroll' | null;
  schema_json: Record<string, unknown>;
  user_id: string;
  created_at: string;
  updated_at: string;
  questions: Array<{
    id: string;
    form_id: string;
    type: string;
    title: string;
    description: string | null;
    required: boolean;
    order_index: number;
    options: Record<string, unknown> | null;
    logic_rules: unknown[] | null;
    created_at: string;
    updated_at: string;
  }>;
}

/**
 * Get a published form for respondents to fill out
 */
export async function getPublishedForm(formId: string) {
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from('forms')
    .select(`
      *,
      questions (
        *
      )
    `)
    .eq('id', formId)
    .eq('is_published', true)
    .single();

  if (error || !form) {
    console.error('[getPublishedForm] Error or no form found:', error);
    return { error: 'Form not found or not published' };
  }

  const formWithQuestions = form as unknown as FormWithQuestionsData;

  console.log('[getPublishedForm] Form fetched:', formWithQuestions.id);
  console.log('[getPublishedForm] Questions count:', formWithQuestions.questions?.length || 0);

  // Sort questions by order_index
  const sortedQuestions = (formWithQuestions.questions || []).sort(
    (a, b) => a.order_index - b.order_index
  );

  return {
    data: {
      ...formWithQuestions,
      questions: sortedQuestions,
    } as FormWithQuestions,
  };
}

/**
 * Start a new response (creates a response record)
 */
export async function startResponse(formId: string, respondentEmail?: string, respondentName?: string) {
  const supabase = await createClient();

  // Get current user (if authenticated)
  const { data: { user } } = await supabase.auth.getUser();

  const { data: response, error } = await supabase
    .from('responses')
    .insert({
      form_id: formId,
      respondent_id: user?.id || null,  // Set respondent_id if user is authenticated
      respondent_email: respondentEmail || null,
      respondent_name: respondentName || null,
      is_complete: false,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error starting response:', error);
    return { error: 'Failed to start response' };
  }

  return { data: response as Response };
}

/**
 * Save or update an answer (auto-save)
 */
export async function saveAnswer(
  responseId: string,
  questionId: string,
  value: AnswerValue
) {
  const supabase = await createClient();

  // Fetch the question to validate against
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    return { error: 'Question not found' };
  }

  // Validate the answer value
  const validation = validateAnswer(question as unknown as Question, value);
  if (!validation.valid) {
    return { error: validation.error || 'Invalid answer' };
  }

  // Check if answer already exists
  const { data: existingAnswer } = await supabase
    .from('answers')
    .select('id')
    .eq('response_id', responseId)
    .eq('question_id', questionId)
    .single();

  if (existingAnswer) {
    // Update existing answer
    const { data, error } = await supabase
      .from('answers')
      .update({
        value_json: value as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAnswer.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating answer:', error);
      return { error: 'Failed to save answer' };
    }

    return { data: data as Answer };
  } else {
    // Insert new answer
    const { data, error } = await supabase
      .from('answers')
      .insert({
        response_id: responseId,
        question_id: questionId,
        value_json: value as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting answer:', error);
      return { error: 'Failed to save answer' };
    }

    return { data: data as Answer };
  }
}

/**
 * Submit a response (mark as complete)
 */
export async function submitResponse(responseId: string) {
  const supabase = await createClient();

  const { data: response, error } = await supabase
    .from('responses')
    .update({
      is_complete: true,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', responseId)
    .select()
    .single();

  if (error) {
    console.error('Error submitting response:', error);
    return { error: 'Failed to submit response' };
  }

  revalidatePath(`/forms/${response.form_id}/submit`);

  return { data: response as Response };
}

/**
 * Get existing response with answers (for resuming)
 */
export async function getResponse(responseId: string) {
  const supabase = await createClient();

  const { data: response, error } = await supabase
    .from('responses')
    .select(`
      *,
      answers (*)
    `)
    .eq('id', responseId)
    .single();

  if (error || !response) {
    return { error: 'Response not found' };
  }

  return { data: response };
}
