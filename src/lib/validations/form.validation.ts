import { z } from 'zod';

export const formCreateSchema = z.object({
  title: z.string().min(1, 'Form title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  // schema_json removed - legacy field, form structure is in questions table
});

export const formUpdateSchema = z.object({
  title: z.string().min(1, 'Form title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  // schema_json removed - legacy field, form structure is in questions table
  is_published: z.boolean().optional(),
  display_mode: z.enum(['single', 'scroll']).optional(),
});

export type FormCreateInput = z.infer<typeof formCreateSchema>;
export type FormUpdateInput = z.infer<typeof formUpdateSchema>;
