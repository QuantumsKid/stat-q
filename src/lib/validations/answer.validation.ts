/**
 * Server-side answer validation
 * Validates answer values against question schemas
 */

import type { Question, QuestionType, ChoiceOptions, LinearScaleOptions, MatrixOptions, ShortTextOptions, LongTextOptions, FileUploadOptions, RankingOptions, SliderOptions } from '@/lib/types/question.types';
import type { AnswerValue } from '@/lib/types/response.types';
import {
  getChoiceOptions,
  getLinearScaleOptions,
  getMatrixOptions,
  getShortTextOptions,
  getLongTextOptions,
  getFileUploadOptions,
  getRankingOptions,
  getSliderOptions,
} from '@/lib/utils/question-type-guards';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string; // Specific field that failed validation
  code?: string; // Error code for programmatic handling
}

/**
 * Validate an answer value against a question schema
 */
export function validateAnswer(question: Question, value: AnswerValue): ValidationResult {
  // Skip validation if value is empty and question is not required
  if (!question.required && isEmptyValue(value)) {
    return { valid: true };
  }

  // Validate based on question type
  switch (question.type) {
    case 'short_text':
      return validateShortText(
        value,
        getShortTextOptions(question.options)
      );

    case 'long_text':
      return validateLongText(
        value,
        getLongTextOptions(question.options)
      );

    case 'multiple_choice':
    case 'dropdown':
      return validateChoice(
        value,
        getChoiceOptions(question.options)
      );

    case 'checkboxes':
      return validateCheckboxes(
        value,
        getChoiceOptions(question.options)
      );

    case 'linear_scale':
      return validateLinearScale(
        value,
        getLinearScaleOptions(question.options)
      );

    case 'matrix':
      return validateMatrix(
        value,
        getMatrixOptions(question.options)
      );

    case 'date_time':
      return validateDateTime(value);

    case 'file_upload':
      return validateFileUpload(
        value,
        getFileUploadOptions(question.options)
      );

    case 'ranking':
      return validateRanking(
        value,
        getRankingOptions(question.options)
      );

    case 'slider':
      return validateSlider(
        value,
        getSliderOptions(question.options)
      );

    default:
      return { valid: true }; // Unknown type, skip validation
  }
}

function isEmptyValue(value: AnswerValue): boolean {
  if (!value || typeof value !== 'object') return true;

  return (
    !value.text &&
    !value.choice_id &&
    (!value.choice_ids || value.choice_ids.length === 0) &&
    value.scale_value === undefined &&
    value.slider_value === undefined &&
    !value.matrix_values &&
    !value.date &&
    !value.time &&
    (!value.files || value.files.length === 0) &&
    (!value.ranked_items || value.ranked_items.length === 0)
  );
}

function validateShortText(value: AnswerValue, options?: ShortTextOptions): ValidationResult {
  if (!value.text) {
    return {
      valid: false,
      error: 'Please provide an answer',
      field: 'text',
      code: 'REQUIRED_FIELD',
    };
  }

  if (typeof value.text !== 'string') {
    return {
      valid: false,
      error: 'Answer must be text',
      field: 'text',
      code: 'INVALID_TYPE',
    };
  }

  // Check max length
  if (options?.maxLength && value.text.length > options.maxLength) {
    return {
      valid: false,
      error: `Answer must be ${options.maxLength} characters or less (currently ${value.text.length})`,
      field: 'text',
      code: 'MAX_LENGTH_EXCEEDED',
    };
  }

  // Validate format
  if (options?.validation) {
    if (options.validation === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.text)) {
        return {
          valid: false,
          error: 'Please enter a valid email address (e.g., name@example.com)',
          field: 'text',
          code: 'INVALID_EMAIL',
        };
      }
    } else if (options.validation === 'url') {
      try {
        new URL(value.text);
      } catch {
        return {
          valid: false,
          error: 'Please enter a valid URL (e.g., https://example.com)',
          field: 'text',
          code: 'INVALID_URL',
        };
      }
    } else if (options.validation === 'number') {
      if (isNaN(Number(value.text))) {
        return {
          valid: false,
          error: 'Please enter a valid number',
          field: 'text',
          code: 'INVALID_NUMBER',
        };
      }
    }
  }

  return { valid: true };
}

function validateLongText(value: AnswerValue, options?: LongTextOptions): ValidationResult {
  if (!value.text) {
    return { valid: false, error: 'Text answer is required' };
  }

  if (typeof value.text !== 'string') {
    return { valid: false, error: 'Invalid text format' };
  }

  // Check max length
  if (options?.maxLength && value.text.length > options.maxLength) {
    return { valid: false, error: `Text exceeds maximum length of ${options.maxLength} characters` };
  }

  return { valid: true };
}

function validateChoice(value: AnswerValue, options?: ChoiceOptions): ValidationResult {
  if (!value.choice_id) {
    return { valid: false, error: 'A choice must be selected' };
  }

  if (typeof value.choice_id !== 'string') {
    return { valid: false, error: 'Invalid choice format' };
  }

  // Validate choice ID exists in options
  if (options?.choices) {
    const validChoiceIds = options.choices.map((c) => c.id);
    if (!validChoiceIds.includes(value.choice_id) && value.choice_id !== 'other') {
      return { valid: false, error: 'Invalid choice selected' };
    }

    // Validate "other" text if other option is selected
    if (value.choice_id === 'other' && !value.other_text) {
      return { valid: false, error: 'Please specify "other" option' };
    }
  }

  return { valid: true };
}

function validateCheckboxes(value: AnswerValue, options?: ChoiceOptions): ValidationResult {
  if (!value.choice_ids || !Array.isArray(value.choice_ids)) {
    return { valid: false, error: 'At least one checkbox must be selected' };
  }

  if (value.choice_ids.length === 0) {
    return { valid: false, error: 'At least one checkbox must be selected' };
  }

  // Check min/max selections
  if (options?.minSelections && value.choice_ids.length < options.minSelections) {
    return { valid: false, error: `At least ${options.minSelections} selections required` };
  }

  if (options?.maxSelections && value.choice_ids.length > options.maxSelections) {
    return { valid: false, error: `Maximum ${options.maxSelections} selections allowed` };
  }

  // Validate all choice IDs exist
  if (options?.choices) {
    const validChoiceIds = options.choices.map((c) => c.id);
    for (const choiceId of value.choice_ids) {
      if (!validChoiceIds.includes(choiceId) && choiceId !== 'other') {
        return { valid: false, error: 'Invalid choice selected' };
      }
    }

    // Validate "other" text if other option is selected
    if (value.choice_ids.includes('other') && !value.other_text) {
      return { valid: false, error: 'Please specify "other" option' };
    }
  }

  return { valid: true };
}

function validateLinearScale(value: AnswerValue, options?: LinearScaleOptions): ValidationResult {
  if (value.scale_value === undefined || value.scale_value === null) {
    return { valid: false, error: 'A scale value must be selected' };
  }

  if (typeof value.scale_value !== 'number') {
    return { valid: false, error: 'Invalid scale value format' };
  }

  // Validate range
  if (options) {
    const min = options.min ?? 1;
    const max = options.max ?? 5;
    const step = options.step ?? 1;

    if (value.scale_value < min || value.scale_value > max) {
      return { valid: false, error: `Scale value must be between ${min} and ${max}` };
    }

    // Validate step
    if ((value.scale_value - min) % step !== 0) {
      return { valid: false, error: `Scale value must be a multiple of ${step}` };
    }
  }

  return { valid: true };
}

function validateMatrix(value: AnswerValue, options?: MatrixOptions): ValidationResult {
  if (!value.matrix_values || typeof value.matrix_values !== 'object') {
    return { valid: false, error: 'Matrix values are required' };
  }

  const matrixValues = value.matrix_values as Record<string, string>;

  // Check required rows
  if (options?.requiredRows && options.requiredRows.length > 0) {
    for (const requiredRowId of options.requiredRows) {
      if (!matrixValues[requiredRowId]) {
        const rowLabel = options.rows?.find((r) => r.id === requiredRowId)?.label || requiredRowId;
        return { valid: false, error: `Row "${rowLabel}" is required` };
      }
    }
  }

  // Validate all row and column IDs exist in options
  if (options?.rows && options?.columns) {
    const validRowIds = options.rows.map((r) => r.id);
    const validColIds = options.columns.map((c) => c.id);

    for (const [rowId, colId] of Object.entries(matrixValues)) {
      if (!validRowIds.includes(rowId)) {
        return { valid: false, error: `Invalid row ID: ${rowId}` };
      }
      if (!validColIds.includes(colId)) {
        return { valid: false, error: `Invalid column ID: ${colId}` };
      }
    }
  }

  return { valid: true };
}

function validateDateTime(value: AnswerValue): ValidationResult {
  if (!value.date && !value.time) {
    return { valid: false, error: 'Date or time is required' };
  }

  // Validate date format (YYYY-MM-DD)
  if (value.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value.date)) {
      return { valid: false, error: 'Invalid date format (expected YYYY-MM-DD)' };
    }

    // Check if date is valid
    const date = new Date(value.date);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }
  }

  // Validate time format (HH:MM)
  if (value.time) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(value.time)) {
      return { valid: false, error: 'Invalid time format (expected HH:MM)' };
    }
  }

  return { valid: true };
}

function validateFileUpload(value: AnswerValue, options?: FileUploadOptions): ValidationResult {
  if (!value.files || !Array.isArray(value.files) || value.files.length === 0) {
    return { valid: false, error: 'At least one file must be uploaded', code: 'REQUIRED_FILE' };
  }

  // Validate number of files
  const maxFiles = options?.maxFiles || 1;
  if (value.files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`,
      code: 'TOO_MANY_FILES',
    };
  }

  // Validate file sizes
  const maxFileSize = (options?.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
  for (const file of value.files) {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum size of ${options?.maxFileSize || 10}MB`,
        code: 'FILE_TOO_LARGE',
      };
    }
  }

  return { valid: true };
}

function validateRanking(value: AnswerValue, options?: RankingOptions): ValidationResult {
  if (!value.ranked_items || !Array.isArray(value.ranked_items)) {
    return { valid: false, error: 'Items must be ranked', code: 'REQUIRED_RANKING' };
  }

  // Validate minimum items ranked
  if (options?.minRank && value.ranked_items.length < options.minRank) {
    return {
      valid: false,
      error: `Please rank at least ${options.minRank} items`,
      code: 'MIN_RANK_NOT_MET',
    };
  }

  // Validate maximum items ranked
  if (options?.maxRank && value.ranked_items.length > options.maxRank) {
    return {
      valid: false,
      error: `Maximum ${options.maxRank} items can be ranked`,
      code: 'MAX_RANK_EXCEEDED',
    };
  }

  // Validate all ranked item IDs exist in options
  if (options?.items) {
    const validItemIds = options.items.map((item) => item.id);
    for (const itemId of value.ranked_items) {
      if (!validItemIds.includes(itemId)) {
        return { valid: false, error: `Invalid item ranked: ${itemId}`, code: 'INVALID_ITEM' };
      }
    }

    // Check for duplicate rankings
    const uniqueItems = new Set(value.ranked_items);
    if (uniqueItems.size !== value.ranked_items.length) {
      return { valid: false, error: 'Items cannot be ranked multiple times', code: 'DUPLICATE_RANKING' };
    }
  }

  return { valid: true };
}

function validateSlider(value: AnswerValue, options?: SliderOptions): ValidationResult {
  if (value.slider_value === undefined || value.slider_value === null) {
    return { valid: false, error: 'A slider value must be selected', code: 'REQUIRED_VALUE' };
  }

  if (typeof value.slider_value !== 'number') {
    return { valid: false, error: 'Invalid slider value format', code: 'INVALID_TYPE' };
  }

  // Validate range
  if (options) {
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const step = options.step ?? 1;

    if (value.slider_value < min || value.slider_value > max) {
      return {
        valid: false,
        error: `Slider value must be between ${min} and ${max}`,
        code: 'OUT_OF_RANGE',
      };
    }

    // Validate step (with small tolerance for floating point precision)
    const remainder = Math.abs((value.slider_value - min) % step);
    if (remainder > 0.001 && remainder < step - 0.001) {
      return {
        valid: false,
        error: `Slider value must be a multiple of ${step}`,
        code: 'INVALID_STEP',
      };
    }
  }

  return { valid: true };
}
