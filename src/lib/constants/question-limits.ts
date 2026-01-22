/**
 * Constants for question type limits and validation
 */

// Linear Scale limits
export const LINEAR_SCALE_MAX_VALUES = 20;
export const LINEAR_SCALE_MIN_VALUE = -999;
export const LINEAR_SCALE_MAX_VALUE = 999;

// Choice options limits
export const MAX_CHOICE_OPTIONS = 100;
export const MIN_CHOICE_OPTIONS = 1;

// Matrix limits
export const MAX_MATRIX_ROWS = 50;
export const MAX_MATRIX_COLUMNS = 20;

// Text input limits
export const MAX_SHORT_TEXT_LENGTH = 500;
export const MAX_LONG_TEXT_LENGTH = 5000;
export const MAX_LONG_TEXT_ROWS = 20;
export const MIN_LONG_TEXT_ROWS = 2;

// Form limits
export const MAX_QUESTIONS_PER_FORM = 100; // Limit to prevent performance issues
export const MAX_FORM_TITLE_LENGTH = 200;
export const MAX_FORM_DESCRIPTION_LENGTH = 1000;

// Auto-save delay (milliseconds)
export const AUTOSAVE_DELAY = 3000;
