/**
 * Type guards and type-safe utilities for working with question types and options
 * Eliminates the need for `as unknown as SpecificType` double casts
 */

import type {
  Question,
  TypedQuestion,
  ShortTextQuestion,
  LongTextQuestion,
  MultipleChoiceQuestion,
  CheckboxesQuestion,
  DropdownQuestion,
  LinearScaleQuestion,
  MatrixQuestion,
  DateTimeQuestion,
  FileUploadQuestion,
  RankingQuestion,
  SliderQuestion,
  QuestionOptions,
  ShortTextOptions,
  LongTextOptions,
  ChoiceOptions,
  LinearScaleOptions,
  MatrixOptions,
  DateTimeOptions,
  FileUploadOptions,
  RankingOptions,
  SliderOptions,
} from '@/lib/types/question.types';

/**
 * Type guard to check if a question is a short text question
 */
export function isShortTextQuestion(question: Question | TypedQuestion): question is ShortTextQuestion {
  return question.type === 'short_text';
}

/**
 * Type guard to check if a question is a long text question
 */
export function isLongTextQuestion(question: Question | TypedQuestion): question is LongTextQuestion {
  return question.type === 'long_text';
}

/**
 * Type guard to check if a question is a multiple choice question
 */
export function isMultipleChoiceQuestion(question: Question | TypedQuestion): question is MultipleChoiceQuestion {
  return question.type === 'multiple_choice';
}

/**
 * Type guard to check if a question is a checkboxes question
 */
export function isCheckboxesQuestion(question: Question | TypedQuestion): question is CheckboxesQuestion {
  return question.type === 'checkboxes';
}

/**
 * Type guard to check if a question is a dropdown question
 */
export function isDropdownQuestion(question: Question | TypedQuestion): question is DropdownQuestion {
  return question.type === 'dropdown';
}

/**
 * Type guard to check if a question is a linear scale question
 */
export function isLinearScaleQuestion(question: Question | TypedQuestion): question is LinearScaleQuestion {
  return question.type === 'linear_scale';
}

/**
 * Type guard to check if a question is a matrix question
 */
export function isMatrixQuestion(question: Question | TypedQuestion): question is MatrixQuestion {
  return question.type === 'matrix';
}

/**
 * Type guard to check if a question is a date/time question
 */
export function isDateTimeQuestion(question: Question | TypedQuestion): question is DateTimeQuestion {
  return question.type === 'date_time';
}

/**
 * Type guard to check if a question is a file upload question
 */
export function isFileUploadQuestion(question: Question | TypedQuestion): question is FileUploadQuestion {
  return question.type === 'file_upload';
}

/**
 * Type guard to check if a question is a ranking question
 */
export function isRankingQuestion(question: Question | TypedQuestion): question is RankingQuestion {
  return question.type === 'ranking';
}

/**
 * Type guard to check if a question is a slider question
 */
export function isSliderQuestion(question: Question | TypedQuestion): question is SliderQuestion {
  return question.type === 'slider';
}

/**
 * Convert a generic Question to a TypedQuestion (assumes the data is correct)
 */
export function asTypedQuestion(question: Question): TypedQuestion {
  return question as TypedQuestion;
}

/**
 * Helper to safely get short text options with defaults
 */
export function getShortTextOptions(options: QuestionOptions | undefined): ShortTextOptions {
  if (!options) return {};
  if (hasShortTextShape(options)) return options;
  return {};
}

/**
 * Helper to safely get long text options with defaults
 */
export function getLongTextOptions(options: QuestionOptions | undefined): LongTextOptions {
  if (!options) return {};
  if (hasLongTextShape(options)) return options;
  return {};
}

/**
 * Helper to safely get choice options with defaults
 */
export function getChoiceOptions(options: QuestionOptions | undefined): ChoiceOptions {
  if (!options) {
    console.warn('[getChoiceOptions] Options undefined, returning empty choices');
    return { choices: [] };
  }
  if (hasChoiceShape(options)) return options;

  console.warn('[getChoiceOptions] Options exist but not choice shape:', options);
  return { choices: [] };
}

/**
 * Helper to safely get linear scale options with defaults
 */
export function getLinearScaleOptions(options: QuestionOptions | undefined): LinearScaleOptions {
  if (!options) return { min: 1, max: 5 };
  if (hasLinearScaleShape(options)) return options;
  return { min: 1, max: 5 };
}

/**
 * Helper to safely get matrix options with defaults
 */
export function getMatrixOptions(options: QuestionOptions | undefined): MatrixOptions {
  if (!options) return { rows: [], columns: [], type: 'radio' };
  if (hasMatrixShape(options)) return options;
  return { rows: [], columns: [], type: 'radio' };
}

/**
 * Helper to safely get date time options with defaults
 */
export function getDateTimeOptions(options: QuestionOptions | undefined): DateTimeOptions {
  if (!options) return {};
  if (hasDateTimeShape(options)) return options;
  return {};
}

/**
 * Helper to safely get file upload options with defaults
 */
export function getFileUploadOptions(options: QuestionOptions | undefined): FileUploadOptions {
  if (!options) return {};
  if (hasFileUploadShape(options)) return options;
  return {};
}

/**
 * Helper to safely get ranking options with defaults
 */
export function getRankingOptions(options: QuestionOptions | undefined): RankingOptions {
  if (!options) return { items: [] };
  if (hasRankingShape(options)) return options;
  return { items: [] };
}

/**
 * Helper to safely get slider options with defaults
 */
export function getSliderOptions(options: QuestionOptions | undefined): SliderOptions {
  if (!options) return { min: 0, max: 100 };
  if (hasSliderShape(options)) return options;
  return { min: 0, max: 100 };
}

// Shape checking functions (runtime validation)
function hasShortTextShape(options: QuestionOptions): options is ShortTextOptions {
  return !('choices' in options) && !('rows' in options) && !('items' in options);
}

function hasLongTextShape(options: QuestionOptions): options is LongTextOptions {
  return !('choices' in options) && !('rows' in options) && !('items' in options) && ('rows' in options || 'placeholder' in options || Object.keys(options).length === 0);
}

function hasChoiceShape(options: QuestionOptions): options is ChoiceOptions {
  return 'choices' in options && Array.isArray(options.choices);
}

function hasLinearScaleShape(options: QuestionOptions): options is LinearScaleOptions {
  return 'min' in options && 'max' in options && !('rows' in options);
}

function hasMatrixShape(options: QuestionOptions): options is MatrixOptions {
  return 'rows' in options && 'columns' in options && Array.isArray(options.rows);
}

function hasDateTimeShape(options: QuestionOptions): options is DateTimeOptions {
  return 'includeTime' in options || 'minDate' in options || 'maxDate' in options || Object.keys(options).length === 0;
}

function hasFileUploadShape(options: QuestionOptions): options is FileUploadOptions {
  return 'maxFileSize' in options || 'allowedFileTypes' in options || 'maxFiles' in options || Object.keys(options).length === 0;
}

function hasRankingShape(options: QuestionOptions): options is RankingOptions {
  return 'items' in options && Array.isArray(options.items);
}

function hasSliderShape(options: QuestionOptions): options is SliderOptions {
  return 'min' in options && 'max' in options && !('rows' in options) && ('step' in options || 'showValue' in options || 'defaultValue' in options || true);
}
