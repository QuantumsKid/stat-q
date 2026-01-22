import { useTranslations } from 'next-intl';

/**
 * Hook for accessing validation error translations
 * Provides type-safe access to validation messages
 */
export function useValidationTranslations() {
  const t = useTranslations('validation');

  return {
    required: () => t('required'),
    invalidEmail: () => t('invalidEmail'),
    invalidUrl: () => t('invalidUrl'),
    invalidNumber: () => t('invalidNumber'),
    minLength: (min: number) => t('minLength', { min }),
    maxLength: (max: number) => t('maxLength', { max }),
    minValue: (min: number) => t('minValue', { min }),
    maxValue: (max: number) => t('maxValue', { max }),
    minSelections: (min: number) => t('minSelections', { min }),
    maxSelections: (max: number) => t('maxSelections', { max }),
    invalidFileType: (types: string) => t('invalidFileType', { types }),
    fileTooLarge: (max: number) => t('fileTooLarge', { max }),
    tooManyFiles: (max: number) => t('tooManyFiles', { max }),
    invalidDateRange: (min: string, max: string) => t('invalidDateRange', { min, max }),
    invalidStep: () => t('invalidStep'),
    circularLogic: () => t('circularLogic'),
    matrixRowRequired: () => t('matrixRowRequired'),
    invalidRankingCount: (min: number, max: number) => t('invalidRankingCount', { min, max }),
  };
}

/**
 * Hook for accessing error message translations
 * Provides type-safe access to error messages
 */
export function useErrorTranslations() {
  const t = useTranslations('errors');

  return {
    unauthenticated: () => t('unauthenticated'),
    unauthorized: () => t('unauthorized'),
    notFound: () => t('notFound'),
    conflict: () => t('conflict'),
    networkError: () => t('networkError'),
    serverError: () => t('serverError'),
    databaseError: () => t('databaseError'),
    rateLimitExceeded: () => t('rateLimitExceeded'),
    validationFailed: () => t('validationFailed'),
    unknown: () => t('unknown'),
  };
}

/**
 * Hook for accessing common UI translations
 */
export function useCommonTranslations() {
  const t = useTranslations('common');

  return {
    save: () => t('save'),
    cancel: () => t('cancel'),
    delete: () => t('delete'),
    edit: () => t('edit'),
    create: () => t('create'),
    update: () => t('update'),
    submit: () => t('submit'),
    loading: () => t('loading'),
    saving: () => t('saving'),
    saved: () => t('saved'),
    error: () => t('error'),
    success: () => t('success'),
    warning: () => t('warning'),
    info: () => t('info'),
    close: () => t('close'),
    back: () => t('back'),
    next: () => t('next'),
    previous: () => t('previous'),
    confirm: () => t('confirm'),
    yes: () => t('yes'),
    no: () => t('no'),
    optional: () => t('optional'),
    required: () => t('required'),
  };
}

/**
 * Hook for accessing form-related translations
 */
export function useFormTranslations() {
  const t = useTranslations('form');

  return {
    title: () => t('title'),
    description: () => t('description'),
    untitledForm: () => t('untitledForm'),
    addQuestion: () => t('addQuestion'),
    editQuestion: () => t('editQuestion'),
    deleteQuestion: () => t('deleteQuestion'),
    duplicateQuestion: () => t('duplicateQuestion'),
    questionTitle: () => t('questionTitle'),
    questionDescription: () => t('questionDescription'),
    makeRequired: () => t('makeRequired'),
    published: () => t('published'),
    draft: () => t('draft'),
    preview: () => t('preview'),
    responses: () => t('responses'),
    analytics: () => t('analytics'),
    noQuestions: () => t('noQuestions'),
    getStarted: () => t('getStarted'),
  };
}
