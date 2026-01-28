'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { questionCreateSchema, questionUpdateSchema } from '@/lib/validations/question.validation';
import type { Question, QuestionCreate, QuestionUpdate } from '@/lib/types/question.types';
import type { FormUpdate } from '@/lib/types/form.types';
import { detectCircularLogic } from '@/lib/utils/logic-evaluator';
import { MAX_QUESTIONS_PER_FORM } from '@/lib/constants/question-limits';
import { logger } from '@/lib/utils/logger';
import { createError, errorResult, successResult, fromSupabaseError, normalizeError } from '@/lib/utils/error-handler';
import type { ActionResult } from '@/lib/types/error.types';

// Check if form has any responses
export async function checkFormHasResponses(formId: string): Promise<{ hasResponses: boolean; count: number }> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId);

  if (error) {
    console.error('Error checking form responses:', error);
    return { hasResponses: false, count: 0 };
  }

  return { hasResponses: (count || 0) > 0, count: count || 0 };
}

// Type for questions with joined forms data
interface QuestionWithForm {
  form_id: string;
  forms: {
    user_id: string;
  };
}

// Type for full question with joined forms data
interface FullQuestionWithForm extends Question {
  forms: {
    user_id: string;
  };
}

export async function getFormWithQuestions(formId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: form, error } = await supabase
    .from('forms')
    .select('*, questions(*)')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error('Form not found');
  }

  // Sort questions by order_index
  if (form.questions) {
    form.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
  }

  return form;
}

export async function updateForm(formId: string, updates: FormUpdate): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn('Unauthorized form update attempt', { formId, operation: 'updateForm' });
      return errorResult(createError(
        'You must be signed in to update forms',
        'UNAUTHENTICATED',
        'AUTH',
        { context: { resource: 'form', resourceId: formId, operation: 'update' } }
      ));
    }

    // Verify ownership
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (fetchError) {
      logger.error('Error fetching form for ownership check', fetchError, {
        userId: user.id,
        formId,
        operation: 'updateForm',
      });
      return errorResult(fromSupabaseError(fetchError, {
        resource: 'form',
        resourceId: formId,
        operation: 'update',
      }));
    }

    if (!form || form.user_id !== user.id) {
      logger.warn('Unauthorized form update attempt', {
        userId: user.id,
        formId,
        formOwnerId: form?.user_id,
        operation: 'updateForm',
      });
      return errorResult(createError(
        'You do not have permission to update this form',
        'UNAUTHORIZED',
        'PERMISSION',
        {
          context: { resource: 'form', resourceId: formId, operation: 'update' },
          statusCode: 403,
        }
      ));
    }

    const { data, error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', formId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating form', error, {
        userId: user.id,
        formId,
        updates,
        operation: 'updateForm',
      });
      return errorResult(fromSupabaseError(error, {
        resource: 'form',
        resourceId: formId,
        operation: 'update',
      }));
    }

    logger.info('Form updated successfully', {
      userId: user.id,
      formId,
      operation: 'updateForm',
    });

    revalidatePath(`/forms/${formId}/edit`);
    return successResult(data);
  } catch (error) {
    logger.error('Unexpected error updating form', error, {
      formId,
      operation: 'updateForm',
    });
    return errorResult(normalizeError(
      error,
      'An unexpected error occurred while updating the form',
      { resource: 'form', resourceId: formId, operation: 'update' }
    ));
  }
}

export async function addQuestion(formId: string, questionData: Omit<QuestionCreate, 'form_id'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify form ownership
  const { data: form } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (!form || form.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Get the next order_index and check max questions limit
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formId);

  const currentCount = count || 0;

  // Enforce max questions per form limit
  if (currentCount >= MAX_QUESTIONS_PER_FORM) {
    return {
      error: `Maximum ${MAX_QUESTIONS_PER_FORM} questions per form allowed. Please delete existing questions to add new ones.`,
      code: 'MAX_QUESTIONS_EXCEEDED',
    };
  }

  const order_index = currentCount;

  // Validate
  const validation = questionCreateSchema.safeParse({
    ...questionData,
    form_id: formId,
    order_index,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from('questions')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding question:', error);
    return { error: 'Failed to add question' };
  }

  revalidatePath(`/forms/${formId}/edit`);
  return { data };
}

export async function updateQuestion(questionId: string, updates: QuestionUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify ownership through form
  const { data: question } = await supabase
    .from('questions')
    .select('form_id, forms!inner(user_id)')
    .eq('id', questionId)
    .single();

  if (!question || (question as unknown as QuestionWithForm).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Validate
  const validation = questionUpdateSchema.safeParse(updates);

  if (!validation.success) {
    console.error('[updateQuestion] Validation failed:', validation.error.issues);
    return { error: validation.error.issues[0].message };
  }

  // If updating logic rules, check for circular dependencies
  if (validation.data.logic_rules) {
    // Fetch all questions in the form
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('form_id', question.form_id)
      .order('order_index');

    if (questionsError || !allQuestions) {
      return { error: 'Failed to validate logic rules' };
    }

    // Create a test array with the updated question
    const testQuestions = allQuestions.map((q) =>
      q.id === questionId ? { ...q, ...validation.data } : q
    ) as Question[];

    // Check for circular logic
    const circularIds = detectCircularLogic(testQuestions);
    if (circularIds.length > 0) {
      return {
        error: 'Circular logic detected. Logic rules would create an infinite loop between questions. Please remove conflicting rules.',
        code: 'CIRCULAR_LOGIC',
      };
    }
  }

  const { data, error } = await supabase
    .from('questions')
    .update(validation.data)
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating question:', error);
    return { error: 'Failed to update question' };
  }

  revalidatePath(`/forms/${question.form_id}/edit`);
  return { data };
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // First check ownership
  const { data: question } = await supabase
    .from('questions')
    .select('form_id, order_index, forms!inner(user_id)')
    .eq('id', questionId)
    .single();

  if (!question || (question as unknown as QuestionWithForm).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  const formId = question.form_id;
  const deletedOrderIndex = (question as { order_index: number }).order_index;

  // Delete the question
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (deleteError) {
    console.error('Error deleting question:', deleteError);
    return { error: 'Failed to delete question' };
  }

  // Reorder remaining questions to fill the gap
  const { data: remainingQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('id, order_index')
    .eq('form_id', formId)
    .gt('order_index', deletedOrderIndex)
    .order('order_index');

  if (fetchError) {
    console.error('Error fetching remaining questions:', fetchError);
    // Question was deleted but reordering failed - not critical
  } else if (remainingQuestions && remainingQuestions.length > 0) {
    // Update order_index for questions that came after the deleted one
    const updates = remainingQuestions.map((q) => ({
      id: q.id,
      order_index: q.order_index - 1,
    }));

    const { error: reorderError } = await supabase
      .from('questions')
      .upsert(updates);

    if (reorderError) {
      console.error('Error reordering questions:', reorderError);
      // Not critical - questions are deleted but order might be off
    }
  }

  revalidatePath(`/forms/${formId}/edit`);
  return { success: true };
}

export async function reorderQuestions(formId: string, questionIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify ownership
  const { data: form } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (!form || form.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Update order_index for all questions
  const updates = questionIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  const { error } = await supabase.from('questions').upsert(updates);

  if (error) {
    console.error('Error reordering questions:', error);
    return { error: 'Failed to reorder questions' };
  }

  revalidatePath(`/forms/${formId}/edit`);
  return { success: true };
}

export async function duplicateQuestion(questionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get original question
  const { data: originalQuestion } = await supabase
    .from('questions')
    .select('*, forms!inner(user_id)')
    .eq('id', questionId)
    .single();

  if (!originalQuestion || (originalQuestion as unknown as FullQuestionWithForm).forms.user_id !== user.id) {
    return { error: 'Unauthorized' };
  }

  // Get count for new order_index
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', originalQuestion.form_id);

  const { data, error } = await supabase
    .from('questions')
    .insert({
      form_id: originalQuestion.form_id,
      type: originalQuestion.type,
      title: `${originalQuestion.title} (Copy)`,
      description: originalQuestion.description,
      options: originalQuestion.options,
      logic_rules: originalQuestion.logic_rules,
      required: originalQuestion.required,
      order_index: count || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error duplicating question:', error);
    return { error: 'Failed to duplicate question' };
  }

  revalidatePath(`/forms/${originalQuestion.form_id}/edit`);
  return { data };
}
