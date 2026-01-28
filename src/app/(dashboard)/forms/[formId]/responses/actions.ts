'use server';

import { createClient } from '@/utils/supabase/server';
import type { Response, Answer, ResponseWithAnswers } from '@/lib/types/response.types';

// Helper to map value_json to value for backward compatibility
function mapAnswerData(answer: Answer): Answer & { value: unknown } {
  return {
    ...answer,
    value: answer.value_json,
  };
}

function mapResponseData(response: ResponseData): ResponseData & {
  answers: Array<Answer & { value: unknown }>;
} {
  return {
    ...response,
    answers: response.answers.map(mapAnswerData),
  };
}

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
    value_json: unknown;
    created_at: string;
    updated_at: string;
  }>;
}

/**
 * Get all responses for a form (with authorization check)
 */
export async function getFormResponses(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized' };
  }

  // Fetch responses with answers (exclude soft-deleted by default)
  const { data: responses, error } = await supabase
    .from('responses')
    .select(`
      *,
      answers (
        id,
        response_id,
        question_id,
        value_json,
        created_at,
        updated_at
      )
    `)
    .eq('form_id', formId)
        .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching responses:', error);
    return { error: 'Failed to fetch responses' };
  }

  // Map value_json to value for backward compatibility
  const mappedResponses = (responses as unknown as ResponseData[]).map(mapResponseData);

  return { data: mappedResponses };
}

/**
 * Get a single response by ID (with authorization check)
 */
export async function getResponseById(responseId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Fetch response with answers
  const { data: response, error } = await supabase
    .from('responses')
    .select(`
      *,
      answers (
        id,
        response_id,
        question_id,
        value_json,
        created_at,
        updated_at
      ),
      forms!inner (user_id)
    `)
    .eq('id', responseId)
    .single();

  if (error || !response) {
    console.error('Error fetching response:', error);
    return { error: 'Response not found' };
  }

  // Check if user owns the form
  interface ResponseWithForm extends ResponseData {
    forms: { user_id: string };
  }

  const responseWithForm = response as unknown as ResponseWithForm;
  if (responseWithForm.forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Map value_json to value for backward compatibility
  const mappedResponse = mapResponseData(response as unknown as ResponseData);

  return { data: mappedResponse };
}

/**
 * Get response statistics for a form
 */
export async function getResponseStats(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized' };
  }

  // Get total responses count
  const { count: totalCount, error: totalError } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId);

  if (totalError) {
    console.error('Error fetching total responses:', totalError);
    return { error: 'Failed to fetch statistics' };
  }

  // Get completed responses count
  const { count: completedCount, error: completedError } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId)
    .eq('is_complete', true);

  if (completedError) {
    console.error('Error fetching completed responses:', completedError);
    return { error: 'Failed to fetch statistics' };
  }

  // Get responses for completion time calculation
  const { data: responses, error: responsesError } = await supabase
    .from('responses')
    .select('started_at, submitted_at')
    .eq('form_id', formId)
    .eq('is_complete', true);

  if (responsesError) {
    console.error('Error fetching response times:', responsesError);
    return { error: 'Failed to fetch statistics' };
  }

  return {
    data: {
      totalResponses: totalCount || 0,
      completedResponses: completedCount || 0,
      incompleteResponses: (totalCount || 0) - (completedCount || 0),
      responses: responses || [],
    },
  };
}

/**
 * Delete a response (with authorization check)
 */
export async function deleteResponse(responseId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check if user owns the form
  const { data: response } = await supabase
    .from('responses')
    .select(`
      id,
      forms!inner (user_id)
    `)
    .eq('id', responseId)
    .single();

  interface ResponseWithForm {
    id: string;
    forms: { user_id: string };
  }

  const responseWithForm = response as unknown as ResponseWithForm;
  if (!responseWithForm || responseWithForm.forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Delete the response (answers will be deleted via cascade)
  const { error } = await supabase
    .from('responses')
    .delete()
    .eq('id', responseId);

  if (error) {
    console.error('Error deleting response:', error);
    return { error: 'Failed to delete response' };
  }

  return { success: true };
}

/**
 * Get answers grouped by question for analytics
 */
export async function getAnswersByQuestion(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized' };
  }

  // Fetch all answers for completed responses
  const { data: answers, error } = await supabase
    .from('answers')
    .select(`
      id,
      response_id,
      question_id,
      value_json,
      created_at,
      updated_at,
      responses!inner (
        is_complete,
        form_id
      )
    `)
    .eq('responses.form_id', formId)
    .eq('responses.is_complete', true);

  if (error) {
    console.error('Error fetching answers:', error);
    return { error: 'Failed to fetch answers' };
  }

  // Group answers by question_id and map value_json to value
  const answersByQuestion: Record<string, (Answer & { value: unknown })[]> = {};

  (answers as unknown as Array<Answer & { responses: { is_complete: boolean; form_id: string } }>).forEach((answer) => {
    const questionId = answer.question_id;
    if (!answersByQuestion[questionId]) {
      answersByQuestion[questionId] = [];
    }
    answersByQuestion[questionId].push(mapAnswerData(answer));
  });

  return { data: answersByQuestion };
}
