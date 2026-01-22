'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import type { LogicRule as LogicRuleType, Question, ConditionOperator } from '@/lib/types/question.types';
import { getOperatorsForQuestionType } from '@/lib/utils/logic-evaluator';

interface LogicRuleProps {
  rule: LogicRuleType;
  questions: Question[];
  conditionQuestions: Question[];
  targetQuestions: Question[];
  onUpdate: (updates: Partial<LogicRuleType>) => void;
  onRemove: () => void;
}

export function LogicRule({
  rule,
  questions,
  conditionQuestions,
  targetQuestions,
  onUpdate,
  onRemove,
}: LogicRuleProps) {
  const sourceQuestion = questions.find((q) => q.id === rule.sourceQuestionId);
  const operators = sourceQuestion
    ? getOperatorsForQuestionType(sourceQuestion.type)
    : [];

  return (
    <div className="p-4 border-2 border-slate-200 rounded-lg space-y-4 bg-slate-50">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium">Logic Rule</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-6 w-6 -mt-1 -mr-1"
          type="button"
          aria-label="Remove logic rule"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* IF condition */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-600">
          IF
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={rule.sourceQuestionId}
            onValueChange={(value) => onUpdate({ sourceQuestionId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Question" />
            </SelectTrigger>
            <SelectContent>
              {conditionQuestions.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">
                  No previous questions
                </div>
              ) : (
                conditionQuestions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title || 'Untitled'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select
            value={rule.condition}
            onValueChange={(value) => onUpdate({ condition: value as ConditionOperator })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={
              typeof rule.value === 'string' || typeof rule.value === 'number'
                ? rule.value
                : ''
            }
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Value"
            disabled={rule.condition === 'is_empty' || rule.condition === 'is_not_empty'}
          />
        </div>
      </div>

      {/* THEN action */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-600">
          THEN
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={rule.action}
            onValueChange={(value) =>
              onUpdate({ action: value as 'show' | 'hide' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show</SelectItem>
              <SelectItem value="hide">Hide</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={rule.targetQuestionIds[0] || ''}
            onValueChange={(value) => onUpdate({ targetQuestionIds: [value] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Target question" />
            </SelectTrigger>
            <SelectContent>
              {targetQuestions.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">
                  No questions after this one
                </div>
              ) : (
                targetQuestions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title || 'Untitled'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        If{' '}
        <span className="font-medium">
          {sourceQuestion?.title || 'the question'}
        </span>{' '}
        {operators.find((op) => op.value === rule.condition)?.label || 'meets condition'}{' '}
        {!['is_empty', 'is_not_empty'].includes(rule.condition) && (
          <span className="font-medium">&quot;{String(rule.value)}&quot;</span>
        )}
        , then {rule.action}{' '}
        <span className="font-medium">
          {targetQuestions.find((q) => q.id === rule.targetQuestionIds[0])
            ?.title || 'the target question'}
        </span>
      </p>
    </div>
  );
}
