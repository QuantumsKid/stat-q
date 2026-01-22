'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Question } from '@/lib/types/question.types';

export interface FormVersion {
  id: string;
  form_id: string;
  version_number: number;
  title: string;
  description: string | null;
  questions: Question[] | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
  is_published: boolean;
}

/**
 * Get all versions for a form
 */
export async function getFormVersions(formId: string): Promise<FormVersion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('form_versions')
    .select('*')
    .eq('form_id', formId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching form versions:', error);
    throw new Error('Failed to fetch form versions');
  }

  return data || [];
}

/**
 * Get a specific version
 */
export async function getFormVersion(versionId: string): Promise<FormVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('form_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) {
    console.error('Error fetching form version:', error);
    return null;
  }

  return data;
}

/**
 * Create a manual version snapshot
 */
export async function createFormVersion(
  formId: string,
  changeSummary?: string
): Promise<{ success: boolean; error?: string; versionId?: string }> {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current form data
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return { success: false, error: 'Form not found' };
    }

    // Get all questions for this form
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('form_id', formId)
      .order('order_index');

    if (questionsError) {
      return { success: false, error: 'Failed to fetch questions' };
    }

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('form_versions')
      .select('version_number')
      .eq('form_id', formId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_number + 1
      : 1;

    // Create version snapshot
    const { data: version, error: versionError } = await supabase
      .from('form_versions')
      .insert({
        form_id: formId,
        version_number: nextVersionNumber,
        title: form.title,
        description: form.description,
        questions: questions,
        settings: {
          display_mode: form.display_mode,
          allow_multiple_responses: form.allow_multiple_responses,
          require_authentication: form.require_authentication,
          show_progress_bar: form.show_progress_bar,
          schedule_start: form.schedule_start,
          schedule_end: form.schedule_end,
          max_responses: form.max_responses,
        },
        created_by: user.id,
        change_summary: changeSummary || `Manual snapshot`,
        is_published: false,
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating version:', versionError);
      return { success: false, error: 'Failed to create version' };
    }

    revalidatePath(`/forms/${formId}/versions`);
    return { success: true, versionId: version.id };
  } catch (error) {
    console.error('Unexpected error creating version:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Restore form from a version
 */
export async function restoreFromVersion(
  formId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get the version
    const { data: version, error: versionError } = await supabase
      .from('form_versions')
      .select('*')
      .eq('id', versionId)
      .eq('form_id', formId)
      .single();

    if (versionError || !version) {
      return { success: false, error: 'Version not found' };
    }

    // Update form with version data
    const { error: formError } = await supabase
      .from('forms')
      .update({
        title: version.title,
        description: version.description,
        display_mode: version.settings?.display_mode,
        allow_multiple_responses: version.settings?.allow_multiple_responses,
        require_authentication: version.settings?.require_authentication,
        show_progress_bar: version.settings?.show_progress_bar,
        schedule_start: version.settings?.schedule_start,
        schedule_end: version.settings?.schedule_end,
        max_responses: version.settings?.max_responses,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formId);

    if (formError) {
      console.error('Error updating form:', formError);
      return { success: false, error: 'Failed to update form' };
    }

    // Delete existing questions
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('form_id', formId);

    if (deleteError) {
      console.error('Error deleting questions:', deleteError);
      return { success: false, error: 'Failed to delete existing questions' };
    }

    // Restore questions from version
    const questionsData = version.questions;
    if (questionsData && questionsData.length > 0) {
      const { error: insertError } = await supabase
        .from('questions')
        .insert(
          questionsData.map((q: Question) => ({
            ...q,
            form_id: formId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );

      if (insertError) {
        console.error('Error restoring questions:', insertError);
        return { success: false, error: 'Failed to restore questions' };
      }
    }

    revalidatePath(`/forms/${formId}`);
    revalidatePath(`/forms/${formId}/edit`);
    revalidatePath(`/forms/${formId}/versions`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error restoring version:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a version
 */
export async function deleteFormVersion(
  versionId: string,
  formId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('form_versions')
      .delete()
      .eq('id', versionId)
      .eq('form_id', formId);

    if (error) {
      console.error('Error deleting version:', error);
      return { success: false, error: 'Failed to delete version' };
    }

    revalidatePath(`/forms/${formId}/versions`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting version:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
