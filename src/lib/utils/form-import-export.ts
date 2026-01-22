/**
 * Form Import/Export Utilities
 * Allows exporting forms to JSON and importing them
 */

import type { Question } from '@/lib/types/question.types';

export interface ExportedForm {
  version: string; // Schema version for compatibility
  title: string;
  description?: string;
  display_mode?: 'single' | 'scroll';
  questions: Array<{
    type: string;
    title: string;
    description?: string;
    required: boolean;
    order_index: number;
    options?: Record<string, unknown>;
    logic_rules?: unknown[];
  }>;
  metadata: {
    exported_at: string;
    exported_by?: string;
    question_count: number;
  };
}

/**
 * Export a form to JSON format
 */
export function exportFormToJSON(
  form: {
    title: string;
    description?: string;
    display_mode?: 'single' | 'scroll';
  },
  questions: Question[],
  exportedBy?: string
): ExportedForm {
  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);

  return {
    version: '1.0',
    title: form.title,
    description: form.description,
    display_mode: form.display_mode,
    questions: sortedQuestions.map((q) => ({
      type: q.type,
      title: q.title,
      description: q.description || undefined,
      required: q.required,
      order_index: q.order_index,
      options: (q.options as Record<string, unknown>) || undefined,
      logic_rules: q.logic_rules || undefined,
    })),
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: exportedBy,
      question_count: questions.length,
    },
  };
}

/**
 * Download form as JSON file
 */
export function downloadFormJSON(
  form: {
    title: string;
    description?: string;
    display_mode?: 'single' | 'scroll';
  },
  questions: Question[],
  exportedBy?: string
): void {
  const exportedForm = exportFormToJSON(form, questions, exportedBy);
  const jsonString = JSON.stringify(exportedForm, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(form.title)}_export.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported form JSON
 */
export function validateImportedForm(data: unknown): {
  valid: boolean;
  error?: string;
  form?: ExportedForm;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON format' };
  }

  const form = data as Partial<ExportedForm>;

  // Check version
  if (!form.version) {
    return { valid: false, error: 'Missing version field' };
  }

  if (form.version !== '1.0') {
    return {
      valid: false,
      error: `Unsupported version: ${form.version}. This app supports version 1.0.`,
    };
  }

  // Check required fields
  if (!form.title || typeof form.title !== 'string') {
    return { valid: false, error: 'Missing or invalid title' };
  }

  if (!form.questions || !Array.isArray(form.questions)) {
    return { valid: false, error: 'Missing or invalid questions array' };
  }

  if (form.questions.length === 0) {
    return { valid: false, error: 'Form must have at least one question' };
  }

  // Validate each question
  for (let i = 0; i < form.questions.length; i++) {
    const q = form.questions[i];

    if (!q.type || typeof q.type !== 'string') {
      return { valid: false, error: `Question ${i + 1}: Missing or invalid type` };
    }

    if (!q.title || typeof q.title !== 'string') {
      return { valid: false, error: `Question ${i + 1}: Missing or invalid title` };
    }

    if (typeof q.required !== 'boolean') {
      return { valid: false, error: `Question ${i + 1}: Missing or invalid required field` };
    }

    if (typeof q.order_index !== 'number') {
      return { valid: false, error: `Question ${i + 1}: Missing or invalid order_index` };
    }
  }

  return { valid: true, form: form as ExportedForm };
}

/**
 * Import form from JSON
 */
export async function importFormFromJSON(file: File): Promise<{
  success: boolean;
  error?: string;
  form?: ExportedForm;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const validation = validateImportedForm(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return { success: true, form: validation.form };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON file' };
    }
    return { success: false, error: 'Failed to read file' };
  }
}

/**
 * Create a form template from an exported form
 */
export function createTemplateFromExport(exportedForm: ExportedForm): {
  title: string;
  description?: string;
  display_mode?: 'single' | 'scroll';
  questions: Array<{
    type: string;
    title: string;
    description?: string;
    required: boolean;
    options?: Record<string, unknown>;
  }>;
} {
  return {
    title: exportedForm.title,
    description: exportedForm.description,
    display_mode: exportedForm.display_mode,
    questions: exportedForm.questions.map((q) => ({
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      options: q.options,
      // Note: We don't include logic_rules when creating a template
      // because question IDs will be different
    })),
  };
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate form summary for import preview
 */
export function generateImportSummary(form: ExportedForm): {
  title: string;
  questionCount: number;
  hasLogicRules: boolean;
  questionTypes: Array<{ type: string; count: number }>;
  exportedAt: string;
  exportedBy?: string;
} {
  const questionTypeCounts = form.questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const questionTypes = Object.entries(questionTypeCounts).map(([type, count]) => ({
    type,
    count,
  }));

  const hasLogicRules = form.questions.some(
    (q) => q.logic_rules && q.logic_rules.length > 0
  );

  return {
    title: form.title,
    questionCount: form.questions.length,
    hasLogicRules,
    questionTypes,
    exportedAt: form.metadata.exported_at,
    exportedBy: form.metadata.exported_by,
  };
}
