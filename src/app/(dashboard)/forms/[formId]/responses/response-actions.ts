'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Soft delete a response (marks as deleted without removing from database)
 */
export async function deleteResponse(responseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseWithForms = { form_id: string; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Soft delete by setting deleted_at timestamp
  const { error } = await supabase
    .from('responses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', responseId)
    .is('deleted_at', null);

  if (error) {
    console.error('Error soft deleting response:', error);
    return { error: 'Failed to delete response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Restore a soft-deleted response
 */
export async function restoreResponse(responseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseWithForms = { form_id: string; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Restore by clearing deleted_at timestamp
  const { error } = await supabase
    .from('responses')
    .update({ deleted_at: null })
    .eq('id', responseId)
    .not('deleted_at', 'is', null);

  if (error) {
    console.error('Error restoring response:', error);
    return { error: 'Failed to restore response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Permanently delete a response (only works on already soft-deleted responses)
 */
export async function permanentlyDeleteResponse(responseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, deleted_at, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseWithForms = { form_id: string; deleted_at: string | null; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Only allow permanent deletion of soft-deleted responses
  if (!(response as unknown as ResponseWithForms).deleted_at) {
    return { error: 'Response must be soft-deleted first' };
  }

  // Permanently delete response (cascades to answers)
  const { error } = await supabase
    .from('responses')
    .delete()
    .eq('id', responseId);

  if (error) {
    console.error('Error permanently deleting response:', error);
    return { error: 'Failed to permanently delete response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Update response (mark as incomplete to allow editing)
 */
export async function reopenResponse(responseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, is_complete, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseData = { form_id: string; is_complete: boolean; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseData).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  if (!response.is_complete) {
    return { error: 'Response is already open for editing' };
  }

  // Mark as incomplete to allow editing
  const { error } = await supabase
    .from('responses')
    .update({
      is_complete: false,
      submitted_at: null,
    })
    .eq('id', responseId);

  if (error) {
    console.error('Error reopening response:', error);
    return { error: 'Failed to reopen response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Bulk soft delete responses
 */
export async function bulkDeleteResponses(responseIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  if (responseIds.length === 0) {
    return { error: 'No responses selected' };
  }

  // Get first response to check ownership and get form_id
  const { data: firstResponse } = await supabase
    .from('responses')
    .select('form_id, forms!inner(user_id)')
    .eq('id', responseIds[0])
    .single();

  type ResponseWithForms = { form_id: string; forms: { user_id: string } };

  if (!firstResponse || (firstResponse as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Soft delete all responses
  const { error } = await supabase
    .from('responses')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', responseIds)
    .is('deleted_at', null);

  if (error) {
    console.error('Error bulk soft deleting responses:', error);
    return { error: 'Failed to delete responses' };
  }

  revalidatePath(`/forms/${firstResponse.form_id}/responses`);
  return { success: true, count: responseIds.length };
}

/**
 * Get deleted responses for a form (trash bin)
 */
export async function getDeletedResponses(formId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user owns the form
  const { data: form } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (!form || form.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Fetch deleted responses
  const { data: responses, error } = await supabase
    .from('responses')
    .select(`
      id,
      form_id,
      respondent_email,
      is_complete,
      submitted_at,
      deleted_at,
      created_at
    `)
    .eq('form_id', formId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching deleted responses:', error);
    return { error: 'Failed to fetch deleted responses' };
  }

  return { data: responses };
}

/**
 * Flag a response for moderation
 */
export async function flagResponse(responseId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, is_flagged, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseWithForms = { form_id: string; is_flagged: boolean; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  if ((response as unknown as ResponseWithForms).is_flagged) {
    return { error: 'Response is already flagged' };
  }

  // Flag the response
  const { error } = await supabase
    .from('responses')
    .update({
      is_flagged: true,
      flag_reason: reason,
      flagged_at: new Date().toISOString(),
      flagged_by: user.id,
    })
    .eq('id', responseId);

  if (error) {
    console.error('Error flagging response:', error);
    return { error: 'Failed to flag response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Unflag a response
 */
export async function unflagResponse(responseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get response with form ownership check
  const { data: response } = await supabase
    .from('responses')
    .select('form_id, is_flagged, forms!inner(user_id)')
    .eq('id', responseId)
    .single();

  type ResponseWithForms = { form_id: string; is_flagged: boolean; forms: { user_id: string } };

  if (!response || (response as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  if (!(response as unknown as ResponseWithForms).is_flagged) {
    return { error: 'Response is not flagged' };
  }

  // Unflag the response
  const { error } = await supabase
    .from('responses')
    .update({
      is_flagged: false,
      flag_reason: null,
      flagged_at: null,
      flagged_by: null,
    })
    .eq('id', responseId);

  if (error) {
    console.error('Error unflagging response:', error);
    return { error: 'Failed to unflag response' };
  }

  revalidatePath(`/forms/${response.form_id}/responses`);
  return { success: true };
}

/**
 * Get flagged responses for a form
 */
export async function getFlaggedResponses(formId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify user owns the form
  const { data: form } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (!form || form.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Fetch flagged responses
  const { data: responses, error } = await supabase
    .from('responses')
    .select(`
      id,
      form_id,
      respondent_email,
      is_complete,
      submitted_at,
      is_flagged,
      flag_reason,
      flagged_at,
      created_at,
      answers (*)
    `)
    .eq('form_id', formId)
    .eq('is_flagged', true)
    .is('deleted_at', null)
    .order('flagged_at', { ascending: false });

  if (error) {
    console.error('Error fetching flagged responses:', error);
    return { error: 'Failed to fetch flagged responses' };
  }

  return { data: responses };
}

/**
 * Bulk flag responses
 */
export async function bulkFlagResponses(responseIds: string[], reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  if (responseIds.length === 0) {
    return { error: 'No responses selected' };
  }

  // Get first response to check ownership and get form_id
  const { data: firstResponse } = await supabase
    .from('responses')
    .select('form_id, forms!inner(user_id)')
    .eq('id', responseIds[0])
    .single();

  type ResponseWithForms = { form_id: string; forms: { user_id: string } };

  if (!firstResponse || (firstResponse as unknown as ResponseWithForms).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Flag all responses
  const { error } = await supabase
    .from('responses')
    .update({
      is_flagged: true,
      flag_reason: reason,
      flagged_at: new Date().toISOString(),
      flagged_by: user.id,
    })
    .in('id', responseIds)
    .eq('is_flagged', false);

  if (error) {
    console.error('Error bulk flagging responses:', error);
    return { error: 'Failed to flag responses' };
  }

  revalidatePath(`/forms/${firstResponse.form_id}/responses`);
  return { success: true, count: responseIds.length };
}
