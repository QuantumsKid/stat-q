import { z } from 'zod';

// Base question schema
export const questionBaseSchema = z.object({
  title: z.string().min(1, 'Question title is required').max(500, 'Question title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  required: z.boolean().default(false),
  type: z.enum([
    'short_text',
    'long_text',
    'multiple_choice',
    'checkboxes',
    'dropdown',
    'linear_scale',
    'matrix',
    'date_time',
  ]),
});

// Choice schema (for options)
export const choiceSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Option label is required'),
  value: z.string().optional(),
  isOther: z.boolean().optional(),
});

// Short text options
export const shortTextOptionsSchema = z.object({
  placeholder: z.string().optional(),
  maxLength: z.number().positive().optional(),
  validation: z.enum(['email', 'url', 'number']).nullable().optional(),
});

// Long text options
export const longTextOptionsSchema = z.object({
  placeholder: z.string().optional(),
  maxLength: z.number().positive().optional(),
  rows: z.number().positive().int().min(2).max(20).optional(),
});

// Choice options (multiple choice, checkboxes, dropdown)
export const choiceOptionsSchema = z.object({
  choices: z.array(choiceSchema),
  allowOther: z.boolean().optional(),
  randomize: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  minSelections: z.number().int().positive().optional(), // For checkboxes
  maxSelections: z.number().int().positive().optional(), // For checkboxes
}).refine(
  (data) => {
    if (data.minSelections !== undefined && data.maxSelections !== undefined) {
      return data.maxSelections >= data.minSelections;
    }
    return true;
  },
  {
    message: 'Maximum selections must be greater than or equal to minimum selections',
  }
);

// Linear scale options
export const linearScaleOptionsSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  step: z.number().positive().optional(),
}).refine(
  (data) => data.max > data.min,
  {
    message: 'Maximum must be greater than minimum',
  }
);

// Matrix item schema
export const matrixItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Matrix item label is required'),
});

// Matrix options
export const matrixOptionsSchema = z.object({
  rows: z.array(matrixItemSchema).min(1, 'At least one row is required'),
  columns: z.array(matrixItemSchema).min(1, 'At least one column is required'),
  type: z.enum(['radio', 'checkbox']),
  requiredRows: z.array(z.string()).optional(),
});

// Date/time options
export const dateTimeOptionsSchema = z.object({
  includeTime: z.boolean().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  format: z.string().optional(),
});

// File upload options
export const fileUploadOptionsSchema = z.object({
  maxFileSize: z.number().positive().optional(), // in MB
  allowedFileTypes: z.array(z.string()).optional(), // e.g., ['image/*', 'application/pdf']
  maxFiles: z.number().int().positive().optional(), // Maximum number of files
  acceptedExtensions: z.string().optional(), // e.g., '.pdf,.doc,.docx'
});

// Ranking item schema
export const rankingItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Ranking item label is required'),
});

// Ranking options
export const rankingOptionsSchema = z.object({
  items: z.array(rankingItemSchema).min(2, 'At least two items are required for ranking'),
  minRank: z.number().int().positive().optional(), // Minimum number of items to rank
  maxRank: z.number().int().positive().optional(), // Maximum number of items to rank
});

// Slider options
export const sliderOptionsSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  showValue: z.boolean().optional(), // Show current value as user drags
  defaultValue: z.number().optional(),
}).refine(
  (data) => data.max > data.min,
  {
    message: 'Maximum must be greater than minimum',
  }
);

// Logic rule schema
export const logicRuleSchema = z.object({
  id: z.string(),
  sourceQuestionId: z.string(),
  condition: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
  ]),
  value: z.unknown(),
  action: z.enum(['show', 'hide']),
  targetQuestionIds: z.array(z.string()).min(1, 'At least one target question is required'),
});

// Question create schema
export const questionCreateSchema = questionBaseSchema.extend({
  form_id: z.string().uuid(),
  order_index: z.number().int().nonnegative(),
  options: z.union([
    shortTextOptionsSchema,
    longTextOptionsSchema,
    choiceOptionsSchema,
    linearScaleOptionsSchema,
    matrixOptionsSchema,
    dateTimeOptionsSchema,
  ]).optional(),
  logic_rules: z.array(logicRuleSchema).optional(),
});

// Question update schema (all fields optional except those needed for validation)
export const questionUpdateSchema = z.object({
  title: z.string().min(1, 'Question title is required').max(500, 'Question title is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  required: z.boolean().optional(),
  order_index: z.number().int().nonnegative().optional(),
  options: z.union([
    shortTextOptionsSchema,
    longTextOptionsSchema,
    choiceOptionsSchema,
    linearScaleOptionsSchema,
    matrixOptionsSchema,
    dateTimeOptionsSchema,
  ]).optional(),
  logic_rules: z.array(logicRuleSchema).optional(),
});

export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type LogicRuleInput = z.infer<typeof logicRuleSchema>;
