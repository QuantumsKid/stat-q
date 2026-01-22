'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '@/lib/types/question.types';
import type {
  ShortTextOptions,
  LongTextOptions,
  ChoiceOptions,
  LinearScaleOptions,
  MatrixOptions,
  DateTimeOptions,
} from '@/lib/types/question.types';
import {
  getShortTextOptions,
  getLongTextOptions,
  getChoiceOptions,
  getLinearScaleOptions,
  getMatrixOptions,
  getDateTimeOptions,
} from '@/lib/utils/question-type-guards';

interface FormPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  questions: Question[];
  displayMode?: 'single' | 'scroll';
}

export function FormPreview({
  isOpen,
  onClose,
  title,
  description,
  questions,
  displayMode = 'scroll',
}: FormPreviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Reset to first question when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
    }
  }, [isOpen]);

  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < questions.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const renderQuestion = (question: Question) => {
    const options = question.options;

    switch (question.type) {
      case 'short_text': {
        const shortTextOpts = getShortTextOptions(options);
        return (
          <Input
            placeholder={shortTextOpts?.placeholder || 'Your answer'}
            disabled
            className="max-w-md"
          />
        );
      }

      case 'long_text': {
        const longTextOpts = getLongTextOptions(options);
        return (
          <Textarea
            placeholder={longTextOpts?.placeholder || 'Your answer'}
            rows={longTextOpts?.rows || 4}
            disabled
            className="max-w-2xl"
          />
        );
      }

      case 'multiple_choice': {
        const choiceOpts = getChoiceOptions(options);
        return (
          <RadioGroup disabled className="space-y-2">
            {choiceOpts?.choices?.map((choice) => (
              <div key={choice.id} className="flex items-center space-x-2">
                <RadioGroupItem value={choice.id} />
                <Label className="font-normal">{choice.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case 'checkboxes': {
        const choiceOpts = getChoiceOptions(options);
        return (
          <div className="space-y-2">
            {choiceOpts?.choices?.map((choice) => (
              <div key={choice.id} className="flex items-center space-x-2">
                <Checkbox disabled />
                <Label className="font-normal">{choice.label}</Label>
              </div>
            ))}
          </div>
        );
      }

      case 'dropdown': {
        const choiceOpts = getChoiceOptions(options);
        return (
          <Select disabled>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {choiceOpts?.choices?.map((choice) => (
                <SelectItem key={choice.id} value={choice.id}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case 'linear_scale': {
        const scaleOpts = getLinearScaleOptions(options);
        const min = scaleOpts?.min || 1;
        const max = scaleOpts?.max || 5;
        const step = scaleOpts?.step || 1;
        const values: number[] = [];
        for (let i = min; i <= max && values.length <= 20; i += step) {
          values.push(i);
        }

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{scaleOpts?.minLabel || min}</span>
              <span>{scaleOpts?.maxLabel || max}</span>
            </div>
            <RadioGroup disabled className="flex justify-between">
              {values.map((value) => (
                <div key={value} className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value={value.toString()} />
                  <Label className="text-xs font-normal">{value}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }

      case 'matrix': {
        const matrixOpts = getMatrixOptions(options);
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-200 p-2 bg-slate-50"></th>
                  {matrixOpts?.columns?.map((col) => (
                    <th
                      key={col.id}
                      className="border border-slate-200 p-2 text-sm font-medium bg-slate-50"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixOpts?.rows?.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-slate-200 p-2 text-sm font-medium bg-slate-50">
                      {row.label}
                    </td>
                    {matrixOpts?.columns?.map((col) => (
                      <td
                        key={col.id}
                        className="border border-slate-200 p-2 text-center"
                      >
                        {matrixOpts.type === 'radio' ? (
                          <RadioGroupItem value={`${row.id}-${col.id}`} disabled />
                        ) : (
                          <Checkbox disabled />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'date_time': {
        const dateOpts = getDateTimeOptions(options);
        return (
          <div className="space-y-2 max-w-md">
            <Input type="date" disabled />
            {dateOpts?.includeTime && <Input type="time" disabled />}
          </div>
        );
      }

      default:
        return <p className="text-sm text-slate-500">Preview not available for this question type</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl">{title || 'Untitled Form'}</DialogTitle>
              {description && (
                <p className="text-slate-600 mt-2">
                  {description}
                </p>
              )}
            </DialogHeader>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">
                  No questions added yet
                </p>
              </div>
            ) : displayMode === 'single' ? (
              // Single Question Mode
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <Badge variant="outline">Single Question Mode</Badge>
                </div>

                <div className="p-6 border-2 border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-sm font-medium">
                      {currentQuestionIndex + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">
                        {questions[currentQuestionIndex].title || 'Untitled Question'}
                        {questions[currentQuestionIndex].required && (
                          <Badge variant="destructive" className="ml-2">
                            Required
                          </Badge>
                        )}
                      </h3>
                      {questions[currentQuestionIndex].description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {questions[currentQuestionIndex].description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">{renderQuestion(questions[currentQuestionIndex])}</div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={!canGoNext}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Scroll Mode - Show all questions
              <div className="space-y-8">
                <div className="mb-4">
                  <Badge variant="outline">Scroll Mode</Badge>
                </div>
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-6 border-2 border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">
                          {question.title || 'Untitled Question'}
                          {question.required && (
                            <Badge variant="destructive" className="ml-2">
                              Required
                            </Badge>
                          )}
                        </h3>
                        {question.description && (
                          <p className="text-sm text-slate-600 mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">{renderQuestion(question)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                This is a preview. No responses will be saved.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
