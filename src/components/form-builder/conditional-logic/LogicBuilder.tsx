'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { LogicRule } from './LogicRule';
import type { LogicRule as LogicRuleType, Question } from '@/lib/types/question.types';
import {
  getAvailableConditionQuestions,
  getAvailableTargetQuestions,
  detectCircularLogic,
} from '@/lib/utils/logic-evaluator';
import { nanoid } from 'nanoid';

interface LogicBuilderProps {
  currentQuestion: Question;
  allQuestions: Question[];
  rules: LogicRuleType[];
  onRulesChange: (rules: LogicRuleType[]) => void;
}

export function LogicBuilder({
  currentQuestion,
  allQuestions,
  rules,
  onRulesChange,
}: LogicBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(rules.length > 0);

  const conditionQuestions = getAvailableConditionQuestions(
    currentQuestion.id,
    allQuestions
  );
  const targetQuestions = getAvailableTargetQuestions(
    currentQuestion.id,
    allQuestions
  );

  const handleAddRule = () => {
    const newRule: LogicRuleType = {
      id: nanoid(),
      sourceQuestionId: conditionQuestions[0]?.id || '',
      condition: 'equals',
      value: '',
      action: 'hide',
      targetQuestionIds: [targetQuestions[0]?.id || ''],
    };

    onRulesChange([...rules, newRule]);
    setIsExpanded(true);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<LogicRuleType>) => {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const handleRemoveRule = (ruleId: string) => {
    onRulesChange(rules.filter((rule) => rule.id !== ruleId));
  };

  const canAddRule =
    conditionQuestions.length > 0 && targetQuestions.length > 0;

  // Check for circular logic
  const circularQuestionIds = detectCircularLogic(allQuestions);
  const hasCircularLogic = circularQuestionIds.includes(currentQuestion.id);

  return (
    <div className="space-y-3">
      {hasCircularLogic && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            Circular Logic Detected
          </p>
          <p className="text-xs text-red-700 mt-1">
            This question's logic creates a circular dependency. This may cause unexpected behavior.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-slate-900 transition-colors"
          type="button"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Conditional Logic
          {rules.length > 0 && (
            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">
              {rules.length}
            </span>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pl-6 border-l-2 border-slate-200">
          {rules.length === 0 ? (
            <p className="text-sm text-slate-500">
              No logic rules yet. Add rules to show or hide questions based on answers.
            </p>
          ) : (
            rules.map((rule) => (
              <LogicRule
                key={rule.id}
                rule={rule}
                questions={allQuestions}
                conditionQuestions={conditionQuestions}
                targetQuestions={targetQuestions}
                onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
                onRemove={() => handleRemoveRule(rule.id)}
              />
            ))
          )}

          {canAddRule ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="w-full"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Logic Rule
            </Button>
          ) : (
            <div className="text-xs text-slate-500 p-3 bg-slate-100 rounded border border-slate-200">
              {conditionQuestions.length === 0 &&
                'Add questions before this one to create conditions.'}
              {targetQuestions.length === 0 &&
                conditionQuestions.length > 0 &&
                'Add questions after this one to target with logic rules.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
