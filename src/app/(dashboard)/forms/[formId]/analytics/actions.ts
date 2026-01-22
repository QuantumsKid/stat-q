'use server';

import { createClient } from '@/utils/supabase/server';
import {
  getCachedFormStats,
  cacheFormStats,
  getCachedQuestionStats,
  cacheQuestionStats,
  getCachedDailyTrends,
  cacheDailyTrends,
  getCachedAnswerFrequency,
  cacheAnswerFrequency,
} from '@/lib/cache/analytics-cache';

/**
 * Get form response statistics using database view
 * Much faster than computing in application layer
 */
export async function getFormResponseStats(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  try {
    // Try cache first
    const cached = await getCachedFormStats(formId);
    if (cached) {
      return { data: cached, error: null };
    }

    // Get stats from database view
    const { data: stats, error } = await supabase
      .from('form_response_stats')
      .select('*')
      .eq('form_id', formId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching form stats:', error);
      return { error: 'Failed to fetch statistics', data: null };
    }

    // Cache the result
    if (stats) {
      await cacheFormStats(formId, stats);
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('Unexpected error fetching form stats:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get question statistics using database view
 */
export async function getQuestionStats(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized', data: null };
  }

  try {
    // Try cache first
    const cached = await getCachedQuestionStats(formId);
    if (cached) {
      return { data: cached, error: null };
    }

    const { data: stats, error } = await supabase
      .from('question_response_stats')
      .select('*')
      .eq('form_id', formId)
      .order('question_id');

    if (error) {
      console.error('Error fetching question stats:', error);
      return { error: 'Failed to fetch question statistics', data: null };
    }

    // Cache the result
    if (stats) {
      await cacheQuestionStats(formId, stats);
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('Unexpected error fetching question stats:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get daily response trends using database view
 */
export async function getDailyResponseTrends(formId: string, days: number = 30) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized', data: null };
  }

  try {
    // Try cache first
    const cached = await getCachedDailyTrends(formId, days);
    if (cached) {
      return { data: cached, error: null };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: trends, error } = await supabase
      .from('daily_response_trends')
      .select('*')
      .eq('form_id', formId)
      .gte('response_date', cutoffDate.toISOString().split('T')[0])
      .order('response_date', { ascending: true });

    if (error) {
      console.error('Error fetching daily trends:', error);
      return { error: 'Failed to fetch trends', data: null };
    }

    // Cache the result
    if (trends) {
      await cacheDailyTrends(formId, days, trends);
    }

    return { data: trends, error: null };
  } catch (error) {
    console.error('Unexpected error fetching trends:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get question abandonment statistics
 */
export async function getQuestionAbandonmentStats(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized', data: null };
  }

  try {
    const { data: stats, error } = await supabase
      .from('question_abandonment_stats')
      .select('*')
      .eq('form_id', formId)
      .order('order_index');

    if (error) {
      console.error('Error fetching abandonment stats:', error);
      return { error: 'Failed to fetch abandonment statistics', data: null };
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('Unexpected error fetching abandonment stats:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get answer frequency distribution for a question
 */
export async function getAnswerFrequencyStats(questionId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  try {
    // Try cache first
    const cached = await getCachedAnswerFrequency(questionId);
    if (cached) {
      return { data: cached, error: null };
    }

    // Get question to verify ownership
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('form_id, forms!inner(user_id)')
      .eq('id', questionId)
      .single();

    type QuestionWithForm = { form_id: string; forms: { user_id: string } };

    if (questionError || !question || (question as unknown as QuestionWithForm).forms.user_id !== user.id) {
      return { error: 'Question not found or unauthorized', data: null };
    }

    const { data: stats, error } = await supabase
      .from('answer_frequency_stats')
      .select('*')
      .eq('question_id', questionId)
      .order('frequency', { ascending: false });

    if (error) {
      console.error('Error fetching answer frequency:', error);
      return { error: 'Failed to fetch answer frequency', data: null };
    }

    // Cache the result
    if (stats) {
      await cacheAnswerFrequency(questionId, stats);
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('Unexpected error fetching answer frequency:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get response quality metrics
 */
export async function getResponseQualityMetrics(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized', data: null };
  }

  try {
    const { data: metrics, error } = await supabase
      .from('response_quality_metrics')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching quality metrics:', error);
      return { error: 'Failed to fetch quality metrics', data: null };
    }

    return { data: metrics, error: null };
  } catch (error) {
    console.error('Unexpected error fetching quality metrics:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

/**
 * Get paginated responses with cursor-based pagination
 */
export async function getPaginatedResponses(
  formId: string,
  options: {
    limit?: number;
    cursor?: string; // Response ID to start after
    sortBy?: 'created_at' | 'submitted_at';
    sortOrder?: 'asc' | 'desc';
  } = {}
) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null, nextCursor: null };
  }

  // Verify user owns the form
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !form || form.user_id !== user.id) {
    return { error: 'Form not found or unauthorized', data: null, nextCursor: null };
  }

  try {
    const limit = options.limit || 20;
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';

    let query = supabase
      .from('responses')
      .select(`
        id,
        respondent_email,
        is_complete,
        submitted_at,
        created_at,
        is_flagged
      `)
      .eq('form_id', formId)
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit + 1); // Fetch one extra to determine if there are more

    // Apply cursor if provided
    if (options.cursor) {
      if (sortOrder === 'desc') {
        query = query.lt('id', options.cursor);
      } else {
        query = query.gt('id', options.cursor);
      }
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching paginated responses:', error);
      return { error: 'Failed to fetch responses', data: null, nextCursor: null };
    }

    // Check if there are more results
    const hasMore = responses && responses.length > limit;
    const nextCursor = hasMore && responses ? responses[limit - 1].id : null;

    // Return only the requested number of items
    const data = responses ? responses.slice(0, limit) : [];

    return { data, error: null, nextCursor, hasMore };
  } catch (error) {
    console.error('Unexpected error fetching paginated responses:', error);
    return { error: 'An unexpected error occurred', data: null, nextCursor: null };
  }
}
