export interface Response {
  id: string;
  form_id: string;
  respondent_email?: string | null;
  respondent_name?: string | null;
  is_complete: boolean;
  started_at: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value_json: unknown;  // Database column name
  value?: unknown;  // Mapped from value_json for backward compatibility
  created_at: string;
  updated_at: string;
}

export interface ResponseWithAnswers extends Response {
  answers: Answer[];
}

export interface AnswerValue {
  // For text questions
  text?: string;

  // For choice questions (multiple_choice, dropdown)
  choice_id?: string;

  // For checkboxes
  choice_ids?: string[];

  // For linear scale
  scale_value?: number;

  // For matrix
  matrix_values?: Record<string, string>; // row_id -> column_id

  // For date/time
  date?: string;
  time?: string;

  // For file upload
  files?: UploadedFile[];

  // For ranking
  ranked_items?: string[]; // Array of item IDs in ranked order

  // For slider
  slider_value?: number;

  // For "other" option in choice questions
  other_text?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // MIME type
  url: string; // Storage URL
  uploadedAt: string;
}

export type FormResponse = Record<string, AnswerValue>;
