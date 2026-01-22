'use server';

import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { AnalyticsPDF } from '@/lib/pdf/analytics-pdf';

// Database view result types
interface QuestionStatRow {
  question_id: string;
  question_title: string;
  question_type: string;
  response_count: number;
  skip_count: number;
  avg_numeric_value?: number;
}

/**
 * Generate and return PDF buffer for analytics report
 */
export async function generateAnalyticsPDF(formId: string) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  try {
    // Get form details
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('title, description, user_id')
      .eq('id', formId)
      .single();

    if (formError || !form || form.user_id !== user.id) {
      return { error: 'Form not found or unauthorized', data: null };
    }

    // Get user profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Get form statistics from database view
    const { data: formStats } = await supabase
      .from('form_response_stats')
      .select('*')
      .eq('form_id', formId)
      .single();

    // Get question statistics
    const { data: questionStats } = await supabase
      .from('question_response_stats')
      .select('*')
      .eq('form_id', formId)
      .order('question_id');

    if (!formStats) {
      return { error: 'Failed to fetch statistics', data: null };
    }

    // Prepare data for PDF
    const stats = {
      totalResponses: formStats.total_responses || 0,
      completedResponses: formStats.completed_responses || 0,
      incompleteResponses: formStats.incomplete_responses || 0,
      completionRate: formStats.completion_rate_percent || 0,
      avgCompletionTime: formStats.avg_completion_time_seconds || 0,
    };

    const processedQuestionStats = (questionStats || []).map((q: QuestionStatRow) => ({
      title: q.question_title,
      type: q.question_type,
      responseCount: q.response_count || 0,
      skipCount: q.skip_count || 0,
    }));

    // Generate PDF
    const pdfDocument = AnalyticsPDF({
      formTitle: form.title,
      formDescription: form.description || undefined,
      stats,
      questionStats: processedQuestionStats,
      chartImages: {}, // Charts will be added in future enhancement
      branding: {
        companyName: 'StatQ',
      },
      generatedAt: new Date(),
      generatedBy: profile?.email || user.email || 'Unknown',
    });

    // Render to buffer
    const buffer = await renderToBuffer(pdfDocument);

    // Convert buffer to base64 for transmission
    const base64 = buffer.toString('base64');

    return {
      data: base64,
      filename: `${form.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
      error: null,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { error: 'Failed to generate PDF', data: null };
  }
}

/**
 * Generate PDF with chart images
 * Charts should be passed as base64-encoded PNG images
 */
export async function generateAnalyticsPDFWithCharts(
  formId: string,
  chartImages: {
    responsesTrend?: string;
    completionRate?: string;
    topAnswers?: string;
  }
) {
  const supabase = await createClient();

  // Check authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  try {
    // Get form details
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('title, description, user_id')
      .eq('id', formId)
      .single();

    if (formError || !form || form.user_id !== user.id) {
      return { error: 'Form not found or unauthorized', data: null };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Get statistics
    const { data: formStats } = await supabase
      .from('form_response_stats')
      .select('*')
      .eq('form_id', formId)
      .single();

    const { data: questionStats } = await supabase
      .from('question_response_stats')
      .select('*')
      .eq('form_id', formId)
      .order('question_id');

    if (!formStats) {
      return { error: 'Failed to fetch statistics', data: null };
    }

    const stats = {
      totalResponses: formStats.total_responses || 0,
      completedResponses: formStats.completed_responses || 0,
      incompleteResponses: formStats.incomplete_responses || 0,
      completionRate: formStats.completion_rate_percent || 0,
      avgCompletionTime: formStats.avg_completion_time_seconds || 0,
    };

    const processedQuestionStats = (questionStats || []).map((q: QuestionStatRow) => ({
      title: q.question_title,
      type: q.question_type,
      responseCount: q.response_count || 0,
      skipCount: q.skip_count || 0,
    }));

    // Generate PDF with charts
    const pdfDocument = AnalyticsPDF({
      formTitle: form.title,
      formDescription: form.description || undefined,
      stats,
      questionStats: processedQuestionStats,
      chartImages,
      branding: {
        companyName: 'StatQ',
      },
      generatedAt: new Date(),
      generatedBy: profile?.email || user.email || 'Unknown',
    });

    const buffer = await renderToBuffer(pdfDocument);
    const base64 = buffer.toString('base64');

    return {
      data: base64,
      filename: `${form.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
      error: null,
    };
  } catch (error) {
    console.error('Error generating PDF with charts:', error);
    return { error: 'Failed to generate PDF', data: null };
  }
}
