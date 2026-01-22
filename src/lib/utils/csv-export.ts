/**
 * CSV Export Utility
 * Exports form responses to CSV format
 */

import type { Question } from '@/lib/types/question.types';

interface ResponseData {
  id: string;
  respondent_email: string | null;
  submitted_at: string | null;
  answers: Array<{
    question_id: string;
    value: unknown;
  }>;
}

export function exportResponsesToCSV(
  formTitle: string,
  questions: Question[],
  responses: ResponseData[]
) {
  // Create headers
  const headers = [
    'Response ID',
    'Respondent Email',
    'Submitted At',
    ...questions.map((q) => q.title),
  ];

  // Create rows
  const rows = responses.map((response) => {
    const row: string[] = [
      response.id,
      response.respondent_email || 'Anonymous',
      response.submitted_at || '',
    ];

    // Add answer values for each question
    questions.forEach((question) => {
      const answer = response.answers.find((a) => a.question_id === question.id);

      if (!answer) {
        row.push('');
        return;
      }

      const value = answer.value as Record<string, unknown>;

      // Format answer based on question type
      switch (question.type) {
        case 'short_text':
        case 'long_text':
          row.push(String(value.text || ''));
          break;

        case 'multiple_choice':
        case 'dropdown': {
          const choiceId = value.choice_id as string;
          if (choiceId === 'other' && value.other_text) {
            row.push(`Other: ${value.other_text}`);
          } else if (question.options && 'choices' in question.options) {
            const choice = question.options.choices.find((c) => c.id === choiceId);
            row.push(choice?.label || choiceId || '');
          } else {
            row.push(choiceId || '');
          }
          break;
        }

        case 'checkboxes': {
          const choiceIds = value.choice_ids as string[];
          if (!choiceIds || choiceIds.length === 0) {
            row.push('');
          } else if (question.options && 'choices' in question.options) {
            const labels = choiceIds.map((id) => {
              if (id === 'other' && value.other_text) {
                return `Other: ${value.other_text}`;
              }
              const choice = question.options && 'choices' in question.options
                ? question.options.choices.find((c) => c.id === id)
                : null;
              return choice?.label || id;
            });
            row.push(labels.join('; '));
          } else {
            row.push(choiceIds.join('; '));
          }
          break;
        }

        case 'linear_scale':
          row.push(String(value.scale_value || ''));
          break;

        case 'matrix': {
          const matrixValues = value.matrix_values as Record<string, string>;
          if (!matrixValues || Object.keys(matrixValues).length === 0) {
            row.push('');
          } else if (question.options && 'rows' in question.options && 'columns' in question.options) {
            const matrixOptions = question.options;
            const entries = Object.entries(matrixValues).map(
              ([rowId, colId]) => {
                const rowLabel = matrixOptions.rows?.find((r) => r.id === rowId)?.label;
                const colLabel = matrixOptions.columns?.find((c) => c.id === colId)?.label;
                return `${rowLabel || rowId}: ${colLabel || colId}`;
              }
            );
            row.push(entries.join('; '));
          } else {
            // Fallback: show raw IDs if options structure is invalid
            const entries = Object.entries(matrixValues).map(
              ([rowId, colId]) => `${rowId}: ${colId}`
            );
            row.push(entries.join('; '));
          }
          break;
        }

        case 'date_time': {
          const parts: string[] = [];
          if (value.date) parts.push(String(value.date));
          if (value.time) parts.push(String(value.time));
          row.push(parts.join(' '));
          break;
        }

        default:
          row.push('');
      }
    });

    return row;
  });

  // Convert to CSV
  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(formTitle)}_responses.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Escape CSV value (handle quotes and commas)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
