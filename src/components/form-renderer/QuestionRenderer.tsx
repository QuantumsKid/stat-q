'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/lib/types/question.types';
import type {
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
import type { AnswerValue } from '@/lib/types/response.types';
import type { LogicEvaluationResult } from '@/lib/types/advanced-logic.types';
import { getQuestionValue } from '@/lib/utils/advanced-logic-evaluator';
import {
  getShortTextOptions,
  getLongTextOptions,
  getChoiceOptions,
  getLinearScaleOptions,
  getMatrixOptions,
  getDateTimeOptions,
} from '@/lib/utils/question-type-guards';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  value?: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string;
  autoFocus?: boolean;
  advancedLogicResult?: LogicEvaluationResult | null;
  formId: string; // Add formId here
}

export function QuestionRenderer({
  question,
  questionNumber,
  value = {},
  onChange,
  error,
  autoFocus = false,
  advancedLogicResult,
  formId, // Destructure formId here
}: QuestionRendererProps) {
  // Apply field piping or calculated values if present
  const effectiveValue = advancedLogicResult
    ? (getQuestionValue(question.id, advancedLogicResult, value) as AnswerValue) || value
    : value;
  const renderQuestionInput = () => {
    const options = question.options;

    switch (question.type) {
      case 'short_text': {
        const opts = getShortTextOptions(options);
        return (
          <Input
            id={`${question.id}-input`}
            value={effectiveValue.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={opts.placeholder || 'Your answer'}
            maxLength={opts.maxLength}
            type={opts.validation === 'email' ? 'email' : opts.validation === 'url' ? 'url' : 'text'}
            className="max-w-md"
            autoFocus={autoFocus}
            aria-labelledby={`${question.id}-title`}
            aria-describedby={ariaDescribedBy}
            aria-required={question.required}
            aria-invalid={!!error}
          />
        );
      }

      case 'long_text': {
        const opts = getLongTextOptions(options);
        return (
          <Textarea
            id={`${question.id}-input`}
            value={effectiveValue.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={opts.placeholder || 'Your answer'}
            rows={opts.rows || 4}
            maxLength={opts.maxLength}
            className="max-w-2xl"
            autoFocus={autoFocus}
            aria-labelledby={`${question.id}-title`}
            aria-describedby={ariaDescribedBy}
            aria-required={question.required}
            aria-invalid={!!error}
          />
        );
      }

      case 'multiple_choice': {
        const opts = getChoiceOptions(options);
        return (
          <RadioGroup
            value={effectiveValue.choice_id || ''}
            onValueChange={(choiceId) => onChange({ choice_id: choiceId })}
            className="space-y-3"
            aria-labelledby={`${question.id}-title`}
            aria-describedby={ariaDescribedBy}
            aria-required={question.required}
            aria-invalid={!!error}
          >
            {opts.choices.map((choice) => (
              <div key={choice.id} className="flex items-center space-x-3">
                <RadioGroupItem value={choice.id} id={`${question.id}-${choice.id}`} />
                <Label htmlFor={`${question.id}-${choice.id}`} className="font-normal cursor-pointer">
                  {choice.label}
                </Label>
              </div>
            ))}
            {opts.allowOther && (
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="other" id={`${question.id}-other`} />
                <Label htmlFor={`${question.id}-other`} className="font-normal cursor-pointer">
                  Other:
                </Label>
                <Input
                  value={effectiveValue.other_text || ''}
                  onChange={(e) => onChange({ choice_id: 'other', other_text: e.target.value })}
                  placeholder="Please specify"
                  className="max-w-xs"
                  disabled={effectiveValue.choice_id !== 'other'}
                />
              </div>
            )}
          </RadioGroup>
        );
      }

      case 'checkboxes': {
        const opts = getChoiceOptions(options);
        const selectedIds = effectiveValue.choice_ids || [];

        const handleCheckboxChange = (choiceId: string, checked: boolean) => {
          let newIds: string[];
          let newValue: AnswerValue;

          if (checked) {
            newIds = [...selectedIds, choiceId];
          } else {
            newIds = selectedIds.filter((id) => id !== choiceId);
          }

          // Preserve other_text if it exists and 'other' is still selected
          newValue = { choice_ids: newIds };
          if (effectiveValue.other_text && newIds.includes('other')) {
            newValue.other_text = effectiveValue.other_text;
          }

          onChange(newValue);
        };

        return (
          <fieldset
            aria-labelledby={`${question.id}-title`}
            aria-describedby={ariaDescribedBy}
            aria-required={question.required}
            aria-invalid={!!error}
          >
            <div className="space-y-3">
              {opts.choices.map((choice) => (
                <div key={choice.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${question.id}-${choice.id}`}
                    checked={selectedIds.includes(choice.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(choice.id, checked as boolean)}
                  />
                  <Label htmlFor={`${question.id}-${choice.id}`} className="font-normal cursor-pointer">
                    {choice.label}
                  </Label>
                </div>
              ))}
            {opts.allowOther && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`${question.id}-other`}
                  checked={selectedIds.includes('other')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange({ choice_ids: [...selectedIds, 'other'], other_text: '' });
                    } else {
                      onChange({
                        choice_ids: selectedIds.filter((id) => id !== 'other'),
                        other_text: undefined
                      });
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-other`} className="font-normal cursor-pointer">
                  Other:
                </Label>
                <Input
                  value={effectiveValue.other_text || ''}
                  onChange={(e) => onChange({ ...effectiveValue, other_text: e.target.value })}
                  placeholder="Please specify"
                  className="max-w-xs"
                  disabled={!selectedIds.includes('other')}
                />
              </div>
            )}
            </div>
          </fieldset>
        );
      }

      case 'dropdown': {
        const opts = getChoiceOptions(options);
        return (
          <div className="space-y-3">
            <Select
              value={effectiveValue.choice_id || ''}
              onValueChange={(choiceId) => onChange({ choice_id: choiceId })}
            >
              <SelectTrigger
                className="max-w-md"
                aria-labelledby={`${question.id}-title`}
                aria-describedby={ariaDescribedBy}
                aria-required={question.required}
                aria-invalid={!!error}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {opts?.choices?.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id}>
                    {choice.label}
                  </SelectItem>
                ))}
                {opts?.allowOther && (
                  <SelectItem value="other">Other</SelectItem>
                )}
              </SelectContent>
            </Select>
            {opts?.allowOther && effectiveValue.choice_id === 'other' && (
              <Input
                value={effectiveValue.other_text || ''}
                onChange={(e) => onChange({ choice_id: 'other', other_text: e.target.value })}
                placeholder="Please specify"
                className="max-w-md"
              />
            )}
          </div>
        );
      }

      case 'linear_scale': {
        const opts = getLinearScaleOptions(options);
        const min = opts?.min || 1;
        const max = opts?.max || 5;
        const step = opts?.step || 1;
        const values: number[] = [];

        for (let i = min; i <= max && values.length <= 20; i += step) {
          values.push(i);
        }

        const minLabel = opts?.minLabel || min.toString();
        const maxLabel = opts?.maxLabel || max.toString();
        const ariaLabel = `Linear scale from ${min} (${minLabel}) to ${max} (${maxLabel})`;

        return (
          <div className="space-y-4">
            <div
              className="flex items-center justify-between text-sm text-slate-600"
              aria-hidden="true"
            >
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
            <RadioGroup
              value={effectiveValue.scale_value?.toString() || ''}
              onValueChange={(val) => onChange({ scale_value: parseInt(val, 10) })}
              className="flex justify-between"
              aria-label={ariaLabel}
              aria-describedby={`${question.id}-scale-description`}
            >
              {values.map((val) => {
                let valueLabel = val.toString();
                if (val === min && opts?.minLabel) {
                  valueLabel = `${val} - ${opts.minLabel}`;
                } else if (val === max && opts?.maxLabel) {
                  valueLabel = `${val} - ${opts.maxLabel}`;
                }

                return (
                  <div key={val} className="flex flex-col items-center space-y-2">
                    <RadioGroupItem
                      value={val.toString()}
                      id={`${question.id}-${val}`}
                      aria-label={valueLabel}
                    />
                    <Label
                      htmlFor={`${question.id}-${val}`}
                      className="text-sm font-normal cursor-pointer"
                      aria-hidden="true"
                    >
                      {val}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            <div
              id={`${question.id}-scale-description`}
              className="sr-only"
            >
              Scale from {min} to {max} with {values.length} options.
              {opts?.minLabel && `Minimum value represents: ${opts.minLabel}. `}
              {opts?.maxLabel && `Maximum value represents: ${opts.maxLabel}.`}
            </div>
          </div>
        );
      }

      case 'matrix': {
        const opts = getMatrixOptions(options);
        const matrixValues = effectiveValue.matrix_values || {};

        const handleMatrixChange = (rowId: string, columnId: string) => {
          onChange({
            matrix_values: { ...matrixValues, [rowId]: columnId },
          });
        };

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

        const rows = opts?.rows || [];
        const columns = opts?.columns || [];

        // Keyboard navigation handler
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleKeyDown = useCallback(
          (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
            const maxRow = rows.length - 1;
            const maxCol = columns.length - 1;

            switch (e.key) {
              case 'ArrowUp':
                e.preventDefault();
                if (rowIndex > 0) {
                  const newRow = rowIndex - 1;
                  setFocusedCell({ row: newRow, col: colIndex });
                  const cellKey = `${rows[newRow].id}-${columns[colIndex].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;

              case 'ArrowDown':
                e.preventDefault();
                if (rowIndex < maxRow) {
                  const newRow = rowIndex + 1;
                  setFocusedCell({ row: newRow, col: colIndex });
                  const cellKey = `${rows[newRow].id}-${columns[colIndex].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;

              case 'ArrowLeft':
                e.preventDefault();
                if (colIndex > 0) {
                  const newCol = colIndex - 1;
                  setFocusedCell({ row: rowIndex, col: newCol });
                  const cellKey = `${rows[rowIndex].id}-${columns[newCol].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;

              case 'ArrowRight':
                e.preventDefault();
                if (colIndex < maxCol) {
                  const newCol = colIndex + 1;
                  setFocusedCell({ row: rowIndex, col: newCol });
                  const cellKey = `${rows[rowIndex].id}-${columns[newCol].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;

              case 'Enter':
              case ' ':
                e.preventDefault();
                handleMatrixChange(rows[rowIndex].id, columns[colIndex].id);
                break;

              case 'Home':
                e.preventDefault();
                if (e.ctrlKey) {
                  // Ctrl+Home: Go to first cell
                  setFocusedCell({ row: 0, col: 0 });
                  const cellKey = `${rows[0].id}-${columns[0].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                } else {
                  // Home: Go to first column in current row
                  setFocusedCell({ row: rowIndex, col: 0 });
                  const cellKey = `${rows[rowIndex].id}-${columns[0].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;

              case 'End':
                e.preventDefault();
                if (e.ctrlKey) {
                  // Ctrl+End: Go to last cell
                  setFocusedCell({ row: maxRow, col: maxCol });
                  const cellKey = `${rows[maxRow].id}-${columns[maxCol].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                } else {
                  // End: Go to last column in current row
                  setFocusedCell({ row: rowIndex, col: maxCol });
                  const cellKey = `${rows[rowIndex].id}-${columns[maxCol].id}`;
                  cellRefs.current.get(cellKey)?.focus();
                }
                break;
            }
          },
          [rows, columns, handleMatrixChange]
        );

        return (
          <div className="overflow-x-auto">
            <div className="text-xs text-slate-500 mb-2" id={`${question.id}-matrix-instructions`}>
              Use arrow keys to navigate, Enter or Space to select
            </div>
            <table
              className="w-full border-collapse"
              role="grid"
              aria-labelledby={`${question.id}-title`}
              aria-describedby={`${question.id}-matrix-instructions`}
            >
              <thead>
                <tr role="row">
                  <th
                    className="border border-slate-200 p-3 bg-slate-50"
                    role="columnheader"
                  ></th>
                  {columns.map((col, colIndex) => (
                    <th
                      key={col.id}
                      className="border border-slate-200 p-3 text-sm font-medium bg-slate-50"
                      role="columnheader"
                      aria-colindex={colIndex + 2}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.id} role="row" aria-rowindex={rowIndex + 2}>
                    <td
                      className="border border-slate-200 p-3 text-sm font-medium bg-slate-50"
                      role="rowheader"
                      aria-colindex={1}
                    >
                      {row.label}
                    </td>
                    {columns.map((col, colIndex) => {
                      const cellKey = `${row.id}-${col.id}`;
                      const isSelected = matrixValues[row.id] === col.id;
                      const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;

                      return (
                        <td
                          key={col.id}
                          ref={(el) => {
                            if (el) {
                              cellRefs.current.set(cellKey, el);
                            } else {
                              cellRefs.current.delete(cellKey);
                            }
                          }}
                          className={`border border-slate-200 p-3 text-center transition-colors ${
                            isFocused ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''
                          }`}
                          role="gridcell"
                          aria-colindex={colIndex + 2}
                          tabIndex={rowIndex === 0 && colIndex === 0 ? 0 : -1}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                          onClick={() => handleMatrixChange(row.id, col.id)}
                          aria-label={`${row.label}, ${col.label}`}
                          aria-selected={isSelected}
                        >
                          {opts.type === 'radio' ? (
                            <div className="flex justify-center items-center">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-slate-400'
                                }`}
                                aria-hidden="true"
                              >
                                {isSelected && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center items-center">
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-slate-400'
                                }`}
                                aria-hidden="true"
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'date_time': {
        const opts = getDateTimeOptions(options);
        return (
          <fieldset
            className="space-y-3 max-w-md"
            aria-labelledby={`${question.id}-title`}
            aria-describedby={ariaDescribedBy}
          >
            <div>
              <Label htmlFor={`${question.id}-date`} className="text-sm mb-2 block">
                Date
              </Label>
              <Input
                id={`${question.id}-date`}
                type="date"
                value={effectiveValue.date || ''}
                onChange={(e) => onChange({ ...effectiveValue, date: e.target.value })}
                min={opts?.minDate}
                max={opts?.maxDate}
                aria-required={question.required}
                aria-invalid={!!error}
              />
            </div>
            {opts?.includeTime && (
              <div>
                <Label htmlFor={`${question.id}-time`} className="text-sm mb-2 block">
                  Time
                </Label>
                <Input
                  id={`${question.id}-time`}
                  type="time"
                  value={effectiveValue.time || ''}
                  onChange={(e) => onChange({ ...effectiveValue, time: e.target.value })}
                  aria-required={question.required}
                  aria-invalid={!!error}
                />
              </div>
            )}
          </fieldset>
        );
      }

      default:
        return <p className="text-sm text-slate-500">Question type not supported</p>;
    }
  };

  // Build aria-describedby string
  const ariaDescribedBy = [
    question.description ? `${question.id}-description` : null,
    error ? `${question.id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="space-y-4">
      {/* Question Title */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {questionNumber}
        </span>
        <div className="flex-1">
          <h3 id={`${question.id}-title`} className="text-lg font-medium">
            {question.title}
            {question.required && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Required
              </Badge>
            )}
          </h3>
          {question.description && (
            <p id={`${question.id}-description`} className="text-sm text-slate-600 mt-1">
              {question.description}
            </p>
          )}
        </div>
      </div>

      {/* Question Input */}
      <div className="mt-4">{renderQuestionInput()}</div>

      {/* Error Message */}
      {error && (
        <p id={`${question.id}-error`} className="text-sm text-red-600 mt-2" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

