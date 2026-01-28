'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { formCreateSchema } from '@/lib/validations/form.validation';
import type { FormWithStats } from '@/lib/types/form.types';
import type { Question, LogicRule } from '@/lib/types/question.types';
import type { AdvancedLogicRule } from '@/lib/types/advanced-logic.types';
import { withErrorHandling, createSuccessResult } from '@/lib/utils/server-error-handler';

export async function getForms(includeArchived = false): Promise<FormWithStats[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[getForms] Fetching forms...');
  console.log('[getForms] User:', user?.id ? 'Authenticated' : 'Not Authenticated');

  if (!user) {
    console.error('[getForms] Unauthorized: User not found.');
    throw new Error('Unauthorized');
  }

  // Get forms with question count and response count, excluding archived by default
  let query = supabase
    .from('forms')
    .select(
      `
      *,
      questions:questions(count),
      responses:responses(count)
    `
    )
    .eq('user_id', user.id);

  // Filter out archived forms unless explicitly requested
  if (!includeArchived) {
    query = query.or('is_archived.is.null,is_archived.eq.false');
  }

  const { data: forms, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('[getForms] Error fetching forms from Supabase:', error);
    throw new Error('Failed to fetch forms');
  }
  console.log('[getForms] Successfully fetched forms:', forms?.length);

  // Transform the data to include question count and response count
  return (forms || []).map((form) => ({
    ...form,
    questionCount: form.questions?.[0]?.count || 0,
    responseCount: form.responses?.[0]?.count || 0,
  }));
}

export async function createForm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  // Validate input
  const validation = formCreateSchema.safeParse({
    title,
    description: description || undefined,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  // Create form
  // Note: schema_json is a legacy field - form structure is stored in questions table
  const { data: form, error } = await supabase
    .from('forms')
    .insert({
      title: validation.data.title,
      description: validation.data.description,
      user_id: user.id,
      schema_json: {}, // Legacy field, kept for backward compatibility
      is_published: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating form:', error);
    return { error: 'Failed to create form' };
  }

  revalidatePath('/dashboard');
  redirect(`/forms/${form.id}/edit`);
}

export async function deleteForm(formId: string) {
  return withErrorHandling('deleteForm', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify ownership
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!form || form.user_id !== user.id) {
      throw new Error('You do not have permission to delete this form');
    }

    // Delete form (cascades to questions)
    const { error } = await supabase.from('forms').delete().eq('id', formId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    return { success: true };
  }, { formId, userId: (await createClient()).auth.getUser().then(r => r.data.user?.id) });
}

export async function duplicateForm(formId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get original form with questions
  const { data: originalForm, error: fetchError } = await supabase
    .from('forms')
    .select('*, questions(*)')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !originalForm) {
    return { error: 'Form not found' };
  }

  // Create duplicate form
  const { data: newForm, error: createError } = await supabase
    .from('forms')
    .insert({
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      schema_json: {}, // Legacy field - form structure is in questions table
      user_id: user.id,
      is_published: false,
    })
    .select()
    .single();

  if (createError || !newForm) {
    return { error: 'Failed to duplicate form' };
  }

  // Duplicate questions if any
  if (originalForm.questions && originalForm.questions.length > 0) {
    // First, create questions without logic rules to get new IDs
    const questionsWithoutLogic = originalForm.questions.map((q: Question) => ({
      form_id: newForm.id,
      type: q.type,
      title: q.title,
      description: q.description,
      options: q.options,
      logic_rules: [], // Will update after getting new IDs
      required: q.required,
      order_index: q.order_index,
    }));

    const { data: newQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsWithoutLogic)
      .select();

    if (questionsError || !newQuestions) {
      console.error('Error duplicating questions:', questionsError);
      // Delete the created form since questions failed
      await supabase.from('forms').delete().eq('id', newForm.id);
      return { error: 'Failed to duplicate form questions' };
    }

    // Create a mapping of old question ID -> new question ID
    const idMapping: Record<string, string> = {};
    originalForm.questions.forEach((oldQ: Question, index: number) => {
      idMapping[oldQ.id] = newQuestions[index].id;
    });

    // Helper function to update question IDs in logic rules
    const updateQuestionIdsInLogicRule = (rule: LogicRule | AdvancedLogicRule): LogicRule | AdvancedLogicRule => {
      const updatedRule = { ...rule };

      // Handle legacy logic rules (check if it's a LogicRule)
      if ('sourceQuestionId' in rule && rule.sourceQuestionId) {
        (updatedRule as LogicRule).sourceQuestionId = idMapping[rule.sourceQuestionId] || rule.sourceQuestionId;
      }
      if ('targetQuestionIds' in rule && rule.targetQuestionIds) {
        (updatedRule as LogicRule).targetQuestionIds = rule.targetQuestionIds.map(
          (targetId: string) => idMapping[targetId] || targetId
        );
      }

      // Handle advanced logic rules
      if ('conditionGroups' in rule && rule.conditionGroups) {
        const advancedRule = updatedRule as AdvancedLogicRule;
        advancedRule.conditionGroups = rule.conditionGroups.map((group) => ({
          ...group,
          conditions: group.conditions.map((condition) => ({
            ...condition,
            sourceQuestionId: idMapping[condition.sourceQuestionId] || condition.sourceQuestionId,
          })),
        }));
      }

      // Handle setValue action (AdvancedLogicRule only)
      if ('setValue' in rule && rule.setValue) {
        (updatedRule as AdvancedLogicRule).setValue = {
          ...rule.setValue,
          targetQuestionId: idMapping[rule.setValue.targetQuestionId] || rule.setValue.targetQuestionId,
        };
        if (rule.setValue.sourceQuestionId) {
          (updatedRule as AdvancedLogicRule).setValue!.sourceQuestionId = idMapping[rule.setValue.sourceQuestionId] || rule.setValue.sourceQuestionId;
        }
      }

      // Handle calculate action (AdvancedLogicRule only)
      if ('calculate' in rule && rule.calculate) {
        (updatedRule as AdvancedLogicRule).calculate = {
          ...rule.calculate,
          targetQuestionId: idMapping[rule.calculate.targetQuestionId] || rule.calculate.targetQuestionId,
          sourceQuestionIds: rule.calculate.sourceQuestionIds.map(
            (sourceId: string) => idMapping[sourceId] || sourceId
          ),
        };
      }

      return updatedRule;
    };

    // Update logic rules with new question IDs
    const updates = originalForm.questions.map((oldQ: Question, index: number) => {
      if (!oldQ.logic_rules || oldQ.logic_rules.length === 0) {
        return null; // No logic rules to update
      }

      const updatedLogicRules = oldQ.logic_rules.map(updateQuestionIdsInLogicRule);

      return {
        id: newQuestions[index].id,
        logic_rules: updatedLogicRules,
      };
    }).filter((update: { id: string; logic_rules: (LogicRule | AdvancedLogicRule)[] } | null): update is { id: string; logic_rules: (LogicRule | AdvancedLogicRule)[] } => update !== null);

    // Update questions with corrected logic rules
    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('questions')
          .update({ logic_rules: update!.logic_rules })
          .eq('id', update!.id);
      }
    }
  }

  revalidatePath('/dashboard');
  return { success: true, formId: newForm.id };
}

export async function archiveForm(formId: string) {
  return withErrorHandling('archiveForm', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify ownership
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select('user_id, is_archived')
      .eq('id', formId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!form || form.user_id !== user.id) {
      throw new Error('You do not have permission to archive this form');
    }

    // Archive form (soft delete)
    const { error } = await supabase
      .from('forms')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', formId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    return createSuccessResult({ success: true });
  }, { formId, userId: (await createClient()).auth.getUser().then(r => r.data.user?.id) });
}

export async function unarchiveForm(formId: string) {
  return withErrorHandling('unarchiveForm', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Verify ownership
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!form || form.user_id !== user.id) {
      throw new Error('You do not have permission to unarchive this form');
    }

    // Unarchive form
    const { error } = await supabase
      .from('forms')
      .update({
        is_archived: false,
        archived_at: null
      })
      .eq('id', formId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/archived');
    return createSuccessResult({ success: true });
  }, { formId, userId: (await createClient()).auth.getUser().then(r => r.data.user?.id) });
}
