import {
  Type,
  AlignLeft,
  Circle,
  CheckSquare,
  ChevronDown,
  TrendingUp,
  Grid3x3,
  Calendar,
  Upload,
  ListOrdered,
  Sliders,
} from 'lucide-react';
import type { QuestionType } from '@/lib/types/question.types';

export const QUESTION_TYPE_CONFIG = {
  short_text: {
    label: 'Short Text',
    icon: Type,
    description: 'Single line text input',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  long_text: {
    label: 'Long Text',
    icon: AlignLeft,
    description: 'Multi-line text area',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  multiple_choice: {
    label: 'Multiple Choice',
    icon: Circle,
    description: 'Single selection from options',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  checkboxes: {
    label: 'Checkboxes',
    icon: CheckSquare,
    description: 'Multiple selections allowed',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  dropdown: {
    label: 'Dropdown',
    icon: ChevronDown,
    description: 'Select from dropdown list',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  linear_scale: {
    label: 'Linear Scale',
    icon: TrendingUp,
    description: 'Scale from min to max',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  matrix: {
    label: 'Matrix',
    icon: Grid3x3,
    description: 'Grid of choices',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
  date_time: {
    label: 'Date/Time',
    icon: Calendar,
    description: 'Date and time picker',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  file_upload: {
    label: 'File Upload',
    icon: Upload,
    description: 'Upload files or images',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
  },
  ranking: {
    label: 'Ranking',
    icon: ListOrdered,
    description: 'Rank items in order',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  slider: {
    label: 'Slider',
    icon: Sliders,
    description: 'Continuous scale slider',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
} as const;

export const QUESTION_TYPES: QuestionType[] = [
  'short_text',
  'long_text',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'matrix',
  'date_time',
  'file_upload',
  'ranking',
  'slider',
];

export function getQuestionTypeConfig(type: QuestionType) {
  return QUESTION_TYPE_CONFIG[type];
}
