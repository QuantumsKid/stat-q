/**
 * Form Submission API Route
 * Handles form responses with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import { rateLimits, getRateLimitIdentifier, checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  // Apply rate limiting (10 submissions per hour per IP)
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = await checkRateLimit(rateLimits.formSubmission, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many submissions',
        message: 'You have exceeded the submission limit. Please try again later.',
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

  try {
    const body = await request.json();
    const { answers, respondentEmail } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: answers required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const supabase = await createClient();

    // Get form to verify it exists and is published
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, status, require_authentication')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    if (form.status !== 'published') {
      return NextResponse.json(
        { error: 'Form is not accepting responses' },
        { status: 403, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check authentication requirement
    if (form.require_authentication) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }
    }

    // Create response record
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        form_id: formId,
        respondent_email: respondentEmail,
        is_complete: true,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (responseError || !response) {
      console.error('Error creating response:', responseError);
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Insert answers
    const answerRecords = Object.entries(answers).map(([questionId, value]) => ({
      response_id: response.id,
      question_id: questionId,
      value,
    }));

    const { error: answersError } = await supabase
      .from('answers')
      .insert(answerRecords);

    if (answersError) {
      console.error('Error inserting answers:', answersError);
      // Clean up response if answers failed
      await supabase.from('responses').delete().eq('id', response.id);
      return NextResponse.json(
        { error: 'Failed to submit answers' },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        responseId: response.id,
        message: 'Form submitted successfully',
      },
      {
        status: 201,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Unexpected error in form submission:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
