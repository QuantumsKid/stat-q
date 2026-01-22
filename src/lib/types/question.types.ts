// Question Types and Interfaces

import type { AdvancedLogicRule } from './advanced-logic.types';

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'matrix'
  | 'date_time'
  | 'file_upload'
  | 'ranking'
  | 'slider';

// Discriminated union types for type-safe questions
export interface BaseQuestionFields {
  id: string;
  form_id: string;
  title: string;
  description?: string;
  required: boolean;
  order_index: number;
  logic_rules?: LogicRule[];
  advanced_logic_rules?: AdvancedLogicRule[];
  created_at: string;
  updated_at: string;
}

export interface ShortTextQuestion extends BaseQuestionFields {
  type: 'short_text';
  options?: ShortTextOptions;
}

export interface LongTextQuestion extends BaseQuestionFields {
  type: 'long_text';
  options?: LongTextOptions;
}

export interface MultipleChoiceQuestion extends BaseQuestionFields {
  type: 'multiple_choice';
  options?: ChoiceOptions;
}

export interface CheckboxesQuestion extends BaseQuestionFields {
  type: 'checkboxes';
  options?: ChoiceOptions;
}

export interface DropdownQuestion extends BaseQuestionFields {
  type: 'dropdown';
  options?: ChoiceOptions;
}

export interface LinearScaleQuestion extends BaseQuestionFields {
  type: 'linear_scale';
  options?: LinearScaleOptions;
}

export interface MatrixQuestion extends BaseQuestionFields {
  type: 'matrix';
  options?: MatrixOptions;
}

export interface DateTimeQuestion extends BaseQuestionFields {
  type: 'date_time';
  options?: DateTimeOptions;
}

export interface FileUploadQuestion extends BaseQuestionFields {
  type: 'file_upload';
  options?: FileUploadOptions;
}

export interface RankingQuestion extends BaseQuestionFields {
  type: 'ranking';
  options?: RankingOptions;
}

export interface SliderQuestion extends BaseQuestionFields {
  type: 'slider';
  options?: SliderOptions;
}

// Discriminated union of all question types
export type TypedQuestion =
  | ShortTextQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | CheckboxesQuestion
  | DropdownQuestion
  | LinearScaleQuestion
  | MatrixQuestion
  | DateTimeQuestion
  | FileUploadQuestion
  | RankingQuestion
  | SliderQuestion;

// Base question interface (legacy - kept for backward compatibility)
export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order_index: number;
  options?: QuestionOptions;
  logic_rules?: LogicRule[]; // Legacy simple logic rules
  advanced_logic_rules?: AdvancedLogicRule[]; // Advanced logic rules
  created_at: string;
  updated_at: string;
}

// Union type for all possible question options
export type QuestionOptions =
  | ShortTextOptions
  | LongTextOptions
  | ChoiceOptions
  | LinearScaleOptions
  | MatrixOptions
  | DateTimeOptions
  | FileUploadOptions
  | RankingOptions
  | SliderOptions;

// Short text options
export interface ShortTextOptions {
  placeholder?: string;
  maxLength?: number;
  validation?: 'email' | 'url' | 'number' | null;
}

// Long text options
export interface LongTextOptions {
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

// Choice options (for multiple_choice, checkboxes, dropdown)
export interface ChoiceOptions {
  choices: Choice[];
  allowOther?: boolean;
  randomizeOptions?: boolean;
  minSelections?: number; // For checkboxes only
  maxSelections?: number; // For checkboxes only
}

export interface Choice {
  id: string;
  label: string;
  value?: string;
  isOther?: boolean;
}

// Linear scale options
export interface LinearScaleOptions {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
}

// Matrix options
export interface MatrixOptions {
  rows: MatrixItem[];
  columns: MatrixItem[];
  type: 'radio' | 'checkbox';
  requiredRows?: string[];
}

export interface MatrixItem {
  id: string;
  label: string;
}

// Date/time options
export interface DateTimeOptions {
  includeDate?: boolean;
  includeTime?: boolean;
  minDate?: string;
  maxDate?: string;
  format?: string;
}

// File upload options
export interface FileUploadOptions {
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[]; // e.g., ['image/*', 'application/pdf']
  maxFiles?: number; // Maximum number of files (1 for single, >1 for multiple)
  acceptedExtensions?: string; // e.g., '.pdf,.doc,.docx'
}

// Ranking options
export interface RankingOptions {
  items: RankingItem[];
  minRank?: number; // Minimum number of items to rank
  maxRank?: number; // Maximum number of items to rank (null = rank all)
}

export interface RankingItem {
  id: string;
  label: string;
}

// Slider options
export interface SliderOptions {
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  showValue?: boolean; // Show current value as user drags
  defaultValue?: number;
}

// Logic rule interface (imported from logic.types.ts but defined here to avoid circular dependency)
export interface LogicRule {
  id: string;
  sourceQuestionId: string;
  condition: ConditionOperator;
  value: unknown;
  action: 'show' | 'hide';
  targetQuestionIds: string[];
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

// Question create payload (without DB-generated fields)
export interface QuestionCreate {
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  order_index: number;
  options?: QuestionOptions;
  logic_rules?: LogicRule[];
}

// Question update payload (partial fields)
export interface QuestionUpdate {
  title?: string;
  description?: string;
  required?: boolean;
  order_index?: number;
  options?: QuestionOptions;
  logic_rules?: LogicRule[];
  advanced_logic_rules?: AdvancedLogicRule[]; // Advanced logic rules
}
