/**
 * Analytics API Route
 * Provides form analytics data with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimits, getRateLimitIdentifier, checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // Apply rate limiting (60 requests per minute per user)
  const identifier = getRateLimitIdentifier(request, user?.id);
  const rateLimitResult = await checkRateLimit(rateLimits.analytics, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Analytics rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Verify user owns the form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, user_id')
      .eq('id', formId)
      .single();

    if (formError || !form || form.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Form not found or unauthorized' },
        { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Get response statistics
    const { count: totalResponses } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId);

    const { count: completedResponses } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId)
      .eq('is_complete', true);

    // Get recent responses (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentResponses } = await supabase
      .from('responses')
      .select('created_at')
      .eq('form_id', formId)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Group by day
    const responsesByDay: Record<string, number> = {};
    recentResponses?.forEach((response) => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      responsesByDay[date] = (responsesByDay[date] || 0) + 1;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          totalResponses: totalResponses || 0,
          completedResponses: completedResponses || 0,
          incompleteResponses: (totalResponses || 0) - (completedResponses || 0),
          responsesByDay,
        },
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
