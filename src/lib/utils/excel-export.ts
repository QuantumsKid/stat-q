/**
 * Excel Export Utility
 * Exports form responses to professional Excel format with multiple worksheets
 */

import ExcelJS from 'exceljs';
import type { Question, Choice } from '@/lib/types/question.types';
import type { Answer } from '@/lib/types/response.types';
import { getChoiceFrequencies, getHighestSelection } from './analytics-helpers';

interface ResponseData {
  id: string;
  respondent_email: string | null;
  submitted_at: string | null;
  is_complete: boolean;
  answers: Array<{
    question_id: string;
    value: unknown;
  }>;
}

interface AnswersByQuestion {
  [questionId: string]: Answer[];
}

/**
 * Export responses to Excel with multiple worksheets and professional formatting
 */
export async function exportResponsesToExcel(
  formTitle: string,
  questions: Question[],
  responses: ResponseData[],
  answersByQuestion?: AnswersByQuestion
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'StatQ';
  workbook.created = new Date();

  // Sheet 1: Summary Statistics
  await createSummarySheet(workbook, formTitle, questions, responses, answersByQuestion);

  // Sheet 2: Individual Responses
  createIndividualResponsesSheet(workbook, questions, responses);

  // Sheet 3: Text Responses
  createTextResponsesSheet(workbook, questions, responses);

  // Sheet 4: Choice Analysis
  createChoiceAnalysisSheet(workbook, questions, responses, answersByQuestion);

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(formTitle)}_responses.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Sheet 1: Summary Statistics
 */
async function createSummarySheet(
  workbook: ExcelJS.Workbook,
  formTitle: string,
  questions: Question[],
  responses: ResponseData[],
  answersByQuestion?: AnswersByQuestion
) {
  const sheet = workbook.addWorksheet('Summary Statistics');

  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = formTitle;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Metadata
  sheet.getCell('A3').value = 'Generated:';
  sheet.getCell('B3').value = new Date().toLocaleString();
  sheet.getCell('A4').value = 'Platform:';
  sheet.getCell('B4').value = 'StatQ';

  // Key Metrics
  sheet.getCell('A6').value = 'Key Metrics';
  sheet.getCell('A6').font = { bold: true, size: 14 };

  const completeResponses = responses.filter((r) => r.is_complete);
  const incompleteResponses = responses.filter((r) => !r.is_complete);

  sheet.getCell('A7').value = 'Total Responses:';
  sheet.getCell('B7').value = responses.length;

  sheet.getCell('A8').value = 'Completed:';
  sheet.getCell('B8').value = completeResponses.length;
  sheet.getCell('B8').font = { color: { argb: 'FF16A34A' } };

  sheet.getCell('A9').value = 'Incomplete:';
  sheet.getCell('B9').value = incompleteResponses.length;
  sheet.getCell('B9').font = { color: { argb: 'FFEA580C' } };

  sheet.getCell('A10').value = 'Completion Rate:';
  const completionRate =
    responses.length > 0 ? (completeResponses.length / responses.length) * 100 : 0;
  sheet.getCell('B10').value = `${completionRate.toFixed(1)}%`;

  // Date Range
  if (completeResponses.length > 0) {
    const dates = completeResponses
      .filter((r) => r.submitted_at)
      .map((r) => new Date(r.submitted_at!));

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

      sheet.getCell('A11').value = 'Date Range:';
      sheet.getCell('B11').value = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
    }
  }

  // Question Summary Table
  sheet.getCell('A13').value = 'Question Summary';
  sheet.getCell('A13').font = { bold: true, size: 14 };

  const headerRow = sheet.getRow(14);
  headerRow.values = ['#', 'Question', 'Type', 'Responses', 'Rate', 'Most Common Answer'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  headerRow.height = 20;

  questions.forEach((question, index) => {
    const rowNum = 15 + index;
    const row = sheet.getRow(rowNum);

    const questionAnswers = answersByQuestion?.[question.id] || [];
    const responseRate =
      completeResponses.length > 0
        ? (questionAnswers.length / completeResponses.length) * 100
        : 0;

    let mostCommon = '-';

    // Get most common answer for choice questions
    if (
      (question.type === 'multiple_choice' ||
        question.type === 'checkboxes' ||
        question.type === 'dropdown') &&
      question.options &&
      'choices' in question.options
    ) {
      const highest = getHighestSelection(questionAnswers, question.options.choices);
      if (highest) {
        mostCommon = `${highest.label} (${highest.percentage}%)`;
      }
    }

    row.values = [
      index + 1,
      question.title,
      formatQuestionType(question.type),
      questionAnswers.length,
      `${responseRate.toFixed(1)}%`,
      mostCommon,
    ];

    // Alternating row colors
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 35;

  // Borders for table
  const lastRow = 14 + questions.length;
  for (let row = 14; row <= lastRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }
}

/**
 * Sheet 2: Individual Responses
 */
function createIndividualResponsesSheet(
  workbook: ExcelJS.Workbook,
  questions: Question[],
  responses: ResponseData[]
) {
  const sheet = workbook.addWorksheet('Individual Responses');

  // Headers
  const headers = [
    'Response ID',
    'Email',
    'Status',
    'Submitted At',
    ...questions.map((q, i) => `Q${i + 1}: ${q.title}`),
  ];

  const headerRow = sheet.getRow(1);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  headerRow.height = 25;

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Data rows
  responses.forEach((response, index) => {
    const rowNum = index + 2;
    const row = sheet.getRow(rowNum);

    const rowData: (string | number)[] = [
      response.id.substring(0, 8) + '...',
      response.respondent_email || 'Anonymous',
      response.is_complete ? 'Complete' : 'Incomplete',
      response.submitted_at
        ? new Date(response.submitted_at).toLocaleString()
        : 'Not submitted',
    ];

    // Add answers for each question
    questions.forEach((question) => {
      const answer = response.answers.find((a) => a.question_id === question.id);
      rowData.push(formatAnswerForExcel(answer?.value, question));
    });

    row.values = rowData;

    // Color coding by status
    if (response.is_complete) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }, // Light green
      };
    } else {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }, // Light yellow
      };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 20;
  questions.forEach((_, i) => {
    sheet.getColumn(5 + i).width = 30;
  });

  // Borders
  for (let row = 1; row <= responses.length + 1; row++) {
    for (let col = 1; col <= headers.length; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { wrapText: true, vertical: 'top' };
    }
  }
}

/**
 * Sheet 3: Text Responses
 */
function createTextResponsesSheet(
  workbook: ExcelJS.Workbook,
  questions: Question[],
  responses: ResponseData[]
) {
  const sheet = workbook.addWorksheet('Text Responses');

  const textQuestions = questions.filter(
    (q) => q.type === 'short_text' || q.type === 'long_text'
  );

  if (textQuestions.length === 0) {
    sheet.getCell('A1').value = 'No text questions in this form';
    return;
  }

  let currentRow = 1;

  textQuestions.forEach((question, qIndex) => {
    // Question title
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = `Q${qIndex + 1}: ${question.title}`;
    titleCell.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' },
    };
    currentRow++;

    // Table headers
    const headerRow = sheet.getRow(currentRow);
    headerRow.values = ['Respondent', 'Response', 'Length', 'Date'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };
    currentRow++;

    // Responses
    const questionResponses = responses
      .filter((r) => r.is_complete)
      .map((response) => {
        const answer = response.answers.find((a) => a.question_id === question.id);
        if (!answer) return null;

        const value = answer.value as Record<string, unknown>;
        const text = String(value?.text || '');

        return {
          email: response.respondent_email || 'Anonymous',
          text,
          length: text.length,
          date: response.submitted_at
            ? new Date(response.submitted_at).toLocaleDateString()
            : '',
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.text.length > 0);

    questionResponses.forEach((resp) => {
      const row = sheet.getRow(currentRow);
      row.values = [resp.email, resp.text, resp.length, resp.date];
      row.alignment = { wrapText: true, vertical: 'top' };

      // Color code by length
      let lengthColor = 'FFFFFFFF'; // White (short)
      if (resp.length > 100) lengthColor = 'FFFEF3C7'; // Yellow (medium)
      if (resp.length > 300) lengthColor = 'FFFED7AA'; // Orange (long)

      row.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: lengthColor },
      };

      currentRow++;
    });

    if (questionResponses.length === 0) {
      const row = sheet.getRow(currentRow);
      row.values = ['No responses yet'];
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;
    }

    currentRow++; // Space between questions
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 60;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 15;
}

/**
 * Sheet 4: Choice Analysis
 */
function createChoiceAnalysisSheet(
  workbook: ExcelJS.Workbook,
  questions: Question[],
  responses: ResponseData[],
  answersByQuestion?: AnswersByQuestion
) {
  const sheet = workbook.addWorksheet('Choice Analysis');

  const choiceQuestions = questions.filter(
    (q) =>
      (q.type === 'multiple_choice' ||
        q.type === 'checkboxes' ||
        q.type === 'dropdown') &&
      q.options &&
      'choices' in q.options
  );

  if (choiceQuestions.length === 0) {
    sheet.getCell('A1').value = 'No choice questions in this form';
    return;
  }

  let currentRow = 1;

  choiceQuestions.forEach((question, qIndex) => {
    if (!question.options || !('choices' in question.options)) return;

    // Question title
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = `Q${qIndex + 1}: ${question.title}`;
    titleCell.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' },
    };
    currentRow++;

    // Table headers
    const headerRow = sheet.getRow(currentRow);
    headerRow.values = ['Option', 'Count', 'Percentage', 'Bar Chart'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };
    currentRow++;

    // Get frequencies
    const questionAnswers = answersByQuestion?.[question.id] || [];
    const frequencies = getChoiceFrequencies(questionAnswers, question.options.choices);
    const highest = getHighestSelection(questionAnswers, question.options.choices);

    frequencies.forEach((freq) => {
      const row = sheet.getRow(currentRow);
      row.values = [
        freq.label,
        freq.count,
        `${freq.percentage}%`,
        '█'.repeat(Math.ceil(freq.percentage / 5)), // Bar chart
      ];

      // Highlight highest selection
      if (highest && freq.choiceId === highest.choiceId) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF86EFAC' }, // Green
        };
        row.font = { bold: true };
      }

      currentRow++;
    });

    currentRow++; // Space between questions
  });

  // Column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 10;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 30;
}

/**
 * Format answer value for Excel display
 */
function formatAnswerForExcel(value: unknown, question: Question): string {
  if (!value) return '';

  const answerValue = value as Record<string, unknown>;

  switch (question.type) {
    case 'short_text':
    case 'long_text':
      return String(answerValue.text || '');

    case 'multiple_choice':
    case 'dropdown': {
      const choiceId = answerValue.choice_id as string;
      if (!choiceId) return '';

      if (choiceId === 'other' && answerValue.other_text) {
        return `Other: ${answerValue.other_text}`;
      }

      if (question.options && 'choices' in question.options) {
        const choice = question.options.choices.find((c) => c.id === choiceId);
        return choice?.label || choiceId;
      }

      return choiceId;
    }

    case 'checkboxes': {
      const choiceIds = answerValue.choice_ids as string[];
      if (!choiceIds || choiceIds.length === 0) return '';

      if (question.options && 'choices' in question.options) {
        const labels = choiceIds.map((id) => {
          if (id === 'other' && answerValue.other_text) {
            return `Other: ${answerValue.other_text}`;
          }
          const choice = question.options && 'choices' in question.options
            ? question.options.choices.find((c) => c.id === id)
            : null;
          return choice?.label || id;
        });
        return labels.join('; ');
      }

      return choiceIds.join('; ');
    }

    case 'linear_scale':
      return String(answerValue.scale_value || '');

    case 'date_time': {
      const parts: string[] = [];
      if (answerValue.date) parts.push(String(answerValue.date));
      if (answerValue.time) parts.push(String(answerValue.time));
      return parts.join(' ');
    }

    default:
      return '';
  }
}

/**
 * Format question type for display
 */
function formatQuestionType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
