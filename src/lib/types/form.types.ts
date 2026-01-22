// Form Types and Interfaces

import type { Question } from './question.types';
import type { Response, Answer } from './response.types';

export interface Form {
  id: string;
  title: string;
  description?: string;
  schema_json: Record<string, unknown>; // @deprecated Legacy field - form structure is in questions table
  user_id: string;
  is_published: boolean;
  display_mode?: 'single' | 'scroll';
  is_archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FormWithQuestions extends Form {
  questions: Question[];
}

export interface FormWithStats extends Form {
  questionCount: number;
  responseCount: number;
}

export interface FormCreate {
  title: string;
  description?: string;
  schema_json?: Record<string, unknown>;
}

export interface FormUpdate {
  title?: string;
  description?: string;
  schema_json?: Record<string, unknown>;
  is_published?: boolean;
  display_mode?: 'single' | 'scroll';
}

// Re-export Response and Answer types from response.types.ts
// to maintain backwards compatibility with existing imports
export type { Response, Answer };
