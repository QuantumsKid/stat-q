/**
 * Advanced Logic Builder
 * UI for creating complex conditional logic with AND/OR combinations
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/lib/types/question.types';
import type {
  AdvancedLogicRule,
  LogicCondition,
  LogicConditionGroup,
  LogicAction,
  LogicalOperator,
} from '@/lib/types/advanced-logic.types';
import { getOperatorsForQuestionType } from '@/lib/utils/logic-evaluator';
import { nanoid } from 'nanoid';

interface AdvancedLogicBuilderProps {
  currentQuestion: Question;
  allQuestions: Question[];
  rules: AdvancedLogicRule[];
  onRulesChange: (rules: AdvancedLogicRule[]) => void;
}

export function AdvancedLogicBuilder({
  currentQuestion,
  allQuestions,
  rules,
  onRulesChange,
}: AdvancedLogicBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(rules.length > 0);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Get questions that can be used in conditions (before current question)
  const conditionQuestions = allQuestions.filter((q) => {
    const currentIndex = allQuestions.findIndex((qu) => qu.id === currentQuestion.id);
    const qIndex = allQuestions.findIndex((qu) => qu.id === q.id);
    return qIndex < currentIndex;
  });

  // Get questions that can be targeted (after current question)
  const targetQuestions = allQuestions.filter((q) => {
    const currentIndex = allQuestions.findIndex((qu) => qu.id === currentQuestion.id);
    const qIndex = allQuestions.findIndex((qu) => qu.id === q.id);
    return qIndex > currentIndex;
  });

  const handleAddRule = () => {
    const newRule: AdvancedLogicRule = {
      id: nanoid(),
      enabled: true,
      conditionGroups: [
        {
          id: nanoid(),
          operator: 'AND',
          conditions: [
            {
              id: nanoid(),
              sourceQuestionId: conditionQuestions[0]?.id || '',
              operator: 'equals',
              value: '',
            },
          ],
        },
      ],
      groupOperator: 'AND',
      action: 'hide',
      targetQuestionIds: [targetQuestions[0]?.id || ''],
    };

    onRulesChange([...rules, newRule]);
    setSelectedRuleId(newRule.id);
    setIsExpanded(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter((r) => r.id !== ruleId));
    if (selectedRuleId === ruleId) {
      setSelectedRuleId(null);
    }
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<AdvancedLogicRule>) => {
    onRulesChange(
      rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
    );
  };

  const handleAddConditionGroup = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const newGroup: LogicConditionGroup = {
      id: nanoid(),
      operator: 'AND',
      conditions: [
        {
          id: nanoid(),
          sourceQuestionId: conditionQuestions[0]?.id || '',
          operator: 'equals',
          value: '',
        },
      ],
    };

    handleUpdateRule(ruleId, {
      conditionGroups: [...rule.conditionGroups, newGroup],
    });
  };

  const handleDeleteConditionGroup = (ruleId: string, groupId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || rule.conditionGroups.length <= 1) return;

    handleUpdateRule(ruleId, {
      conditionGroups: rule.conditionGroups.filter((g) => g.id !== groupId),
    });
  };

  const handleAddCondition = (ruleId: string, groupId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const newCondition: LogicCondition = {
      id: nanoid(),
      sourceQuestionId: conditionQuestions[0]?.id || '',
      operator: 'equals',
      value: '',
    };

    handleUpdateRule(ruleId, {
      conditionGroups: rule.conditionGroups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, newCondition] }
          : g
      ),
    });
  };

  const handleDeleteCondition = (ruleId: string, groupId: string, conditionId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    handleUpdateRule(ruleId, {
      conditionGroups: rule.conditionGroups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
          : g
      ),
    });
  };

  const handleUpdateCondition = (
    ruleId: string,
    groupId: string,
    conditionId: string,
    updates: Partial<LogicCondition>
  ) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    handleUpdateRule(ruleId, {
      conditionGroups: rule.conditionGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : g
      ),
    });
  };

  const canAddRule = conditionQuestions.length > 0 && targetQuestions.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-slate-900:text-slate-100 transition-colors"
          type="button"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Advanced Conditional Logic
          {rules.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
            </Badge>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pl-6 border-l-2 border-slate-200">
          {rules.length === 0 ? (
            <p className="text-sm text-slate-500">
              No advanced logic rules yet. Create complex conditions with AND/OR operators.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedRuleId === rule.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          handleUpdateRule(rule.id, { enabled })
                        }
                      />
                      <button
                        onClick={() =>
                          setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)
                        }
                        className="text-sm font-medium text-left flex-1"
                        type="button"
                      >
                        {rule.name || `Rule ${rules.indexOf(rule) + 1}`}
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteRule(rule.id)}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {selectedRuleId === rule.id && (
                    <div className="mt-3 space-y-3 text-sm">
                      {/* Rule name/description */}
                      <div className="space-y-1">
                        <Label htmlFor={`rule-name-${rule.id}`}>Rule Name (Optional)</Label>
                        <Input
                          id={`rule-name-${rule.id}`}
                          value={rule.name || ''}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { name: e.target.value })
                          }
                          placeholder="e.g., Show follow-up if user selects Yes"
                        />
                      </div>

                      {/* Condition Groups */}
                      <div className="space-y-3">
                        <Label>Conditions</Label>
                        {rule.conditionGroups.map((group, groupIndex) => (
                          <div key={group.id} className="space-y-2">
                            {/* Group operator badge (between groups) */}
                            {groupIndex > 0 && (
                              <div className="flex items-center justify-center">
                                <Select
                                  value={rule.groupOperator}
                                  onValueChange={(value) =>
                                    handleUpdateRule(rule.id, {
                                      groupOperator: value as LogicalOperator,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-20 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">AND</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Condition Group */}
                            <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  Group {groupIndex + 1}
                                </Badge>
                                {rule.conditionGroups.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleDeleteConditionGroup(rule.id, group.id)
                                    }
                                    type="button"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {/* Conditions in this group */}
                              {group.conditions.map((condition, condIndex) => (
                                <div key={condition.id} className="space-y-2">
                                  {/* Condition operator badge (between conditions) */}
                                  {condIndex > 0 && (
                                    <div className="flex items-center justify-center">
                                      <Select
                                        value={group.operator}
                                        onValueChange={(value) => {
                                          handleUpdateRule(rule.id, {
                                            conditionGroups: rule.conditionGroups.map((g) =>
                                              g.id === group.id
                                                ? { ...g, operator: value as LogicalOperator }
                                                : g
                                            ),
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="w-16 h-6 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="AND">AND</SelectItem>
                                          <SelectItem value="OR">OR</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {/* Single Condition */}
                                  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                                    <div className="flex-1 space-y-2">
                                      {/* Source Question */}
                                      <Select
                                        value={condition.sourceQuestionId}
                                        onValueChange={(value) =>
                                          handleUpdateCondition(
                                            rule.id,
                                            group.id,
                                            condition.id,
                                            { sourceQuestionId: value }
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Select question" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {conditionQuestions.map((q) => (
                                            <SelectItem key={q.id} value={q.id}>
                                              {q.title || `Question ${q.order_index + 1}`}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      {/* Operator */}
                                      <Select
                                        value={condition.operator}
                                        onValueChange={(value) =>
                                          handleUpdateCondition(
                                            rule.id,
                                            group.id,
                                            condition.id,
                                            { operator: value as any }
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {condition.sourceQuestionId &&
                                            (() => {
                                              const sourceQ = conditionQuestions.find(
                                                (q) => q.id === condition.sourceQuestionId
                                              );
                                              const operators = sourceQ
                                                ? getOperatorsForQuestionType(sourceQ.type)
                                                : [];
                                              return operators.map((op) => (
                                                <SelectItem key={op.value} value={op.value}>
                                                  {op.label}
                                                </SelectItem>
                                              ));
                                            })()}
                                        </SelectContent>
                                      </Select>

                                      {/* Value Input */}
                                      {!['is_empty', 'is_not_empty'].includes(
                                        condition.operator
                                      ) && (
                                        <Input
                                          value={String(condition.value || '')}
                                          onChange={(e) =>
                                            handleUpdateCondition(
                                              rule.id,
                                              group.id,
                                              condition.id,
                                              { value: e.target.value }
                                            )
                                          }
                                          placeholder="Value"
                                          className="h-8 text-xs"
                                        />
                                      )}
                                    </div>

                                    {/* Delete Condition Button */}
                                    {group.conditions.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 mt-1"
                                        onClick={() =>
                                          handleDeleteCondition(
                                            rule.id,
                                            group.id,
                                            condition.id
                                          )
                                        }
                                        type="button"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Add Condition to Group */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddCondition(rule.id, group.id)}
                                className="w-full h-7 text-xs"
                                type="button"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Condition
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Add Condition Group */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddConditionGroup(rule.id)}
                          className="w-full h-8 text-xs"
                          type="button"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Condition Group
                        </Button>
                      </div>

                      {/* Action selector */}
                      <div className="space-y-1">
                        <Label>Action</Label>
                        <Select
                          value={rule.action}
                          onValueChange={(value) =>
                            handleUpdateRule(rule.id, { action: value as LogicAction })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="show">Show questions</SelectItem>
                            <SelectItem value="hide">Hide questions</SelectItem>
                            <SelectItem value="require">Make required</SelectItem>
                            <SelectItem value="unrequire">Make optional</SelectItem>
                            <SelectItem value="set_value">Set value (field piping)</SelectItem>
                            <SelectItem value="calculate">Calculate value</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Field Piping Configuration */}
                      {rule.action === 'set_value' && (
                        <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label className="text-sm font-medium">Field Piping Configuration</Label>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`target-${rule.id}`} className="text-xs">Target Question</Label>
                              <Select
                                value={rule.setValue?.targetQuestionId || ''}
                                onValueChange={(value) =>
                                  handleUpdateRule(rule.id, {
                                    setValue: {
                                      type: 'set_value',
                                      targetQuestionId: value,
                                      value: 'piped',
                                      sourceQuestionId: conditionQuestions[0]?.id,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger id={`target-${rule.id}`} className="h-8 text-xs">
                                  <SelectValue placeholder="Select target question" />
                                </SelectTrigger>
                                <SelectContent>
                                  {targetQuestions.map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                      {q.title || `Question ${q.order_index + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`source-${rule.id}`} className="text-xs">Source Question (to copy value from)</Label>
                              <Select
                                value={rule.setValue?.sourceQuestionId || ''}
                                onValueChange={(value) =>
                                  handleUpdateRule(rule.id, {
                                    setValue: {
                                      ...rule.setValue,
                                      type: 'set_value',
                                      targetQuestionId: rule.setValue?.targetQuestionId || targetQuestions[0]?.id || '',
                                      value: 'piped',
                                      sourceQuestionId: value,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger id={`source-${rule.id}`} className="h-8 text-xs">
                                  <SelectValue placeholder="Select source question" />
                                </SelectTrigger>
                                <SelectContent>
                                  {conditionQuestions.map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                      {q.title || `Question ${q.order_index + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-blue-700">
                              The value from the source question will be copied to the target question.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Calculation Configuration */}
                      {rule.action === 'calculate' && (
                        <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <Label className="text-sm font-medium">Calculation Configuration</Label>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`calc-target-${rule.id}`} className="text-xs">Target Question (to store result)</Label>
                              <Select
                                value={rule.calculate?.targetQuestionId || ''}
                                onValueChange={(value) =>
                                  handleUpdateRule(rule.id, {
                                    calculate: {
                                      type: 'calculate',
                                      targetQuestionId: value,
                                      formula: rule.calculate?.formula || 'Q1 + Q2',
                                      sourceQuestionIds: rule.calculate?.sourceQuestionIds || [],
                                    },
                                  })
                                }
                              >
                                <SelectTrigger id={`calc-target-${rule.id}`} className="h-8 text-xs">
                                  <SelectValue placeholder="Select target question" />
                                </SelectTrigger>
                                <SelectContent>
                                  {targetQuestions.filter(q => ['linear_scale', 'slider', 'short_text'].includes(q.type)).map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                      {q.title || `Question ${q.order_index + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`calc-sources-${rule.id}`} className="text-xs">Source Questions</Label>
                              <div className="p-2 border rounded-md space-y-1 max-h-32 overflow-y-auto">
                                {conditionQuestions.filter(q => ['linear_scale', 'slider'].includes(q.type)).map((q) => (
                                  <label
                                    key={q.id}
                                    className="flex items-center gap-2 text-xs hover:bg-slate-100 p-1 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={rule.calculate?.sourceQuestionIds.includes(q.id) || false}
                                      onChange={(e) => {
                                        const newSources = e.target.checked
                                          ? [...(rule.calculate?.sourceQuestionIds || []), q.id]
                                          : (rule.calculate?.sourceQuestionIds || []).filter(id => id !== q.id);
                                        handleUpdateRule(rule.id, {
                                          calculate: {
                                            ...rule.calculate,
                                            type: 'calculate',
                                            targetQuestionId: rule.calculate?.targetQuestionId || targetQuestions[0]?.id || '',
                                            formula: rule.calculate?.formula || 'Q1 + Q2',
                                            sourceQuestionIds: newSources,
                                          },
                                        });
                                      }}
                                      className="rounded"
                                    />
                                    <span>{q.title || `Question ${q.order_index + 1}`}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`formula-${rule.id}`} className="text-xs">Formula</Label>
                              <Input
                                id={`formula-${rule.id}`}
                                value={rule.calculate?.formula || ''}
                                onChange={(e) =>
                                  handleUpdateRule(rule.id, {
                                    calculate: {
                                      ...rule.calculate,
                                      type: 'calculate',
                                      targetQuestionId: rule.calculate?.targetQuestionId || targetQuestions[0]?.id || '',
                                      formula: e.target.value,
                                      sourceQuestionIds: rule.calculate?.sourceQuestionIds || [],
                                    },
                                  })
                                }
                                placeholder="e.g., Q1 + Q2 or (Q1 * Q2) / 100"
                                className="h-8 text-xs font-mono"
                              />
                              <p className="text-xs text-purple-700">
                                Use Q1, Q2, Q3, etc. to reference selected source questions. Supports +, -, *, /, ( )
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Target Questions (only for show/hide/require/unrequire actions) */}
                      {!['set_value', 'calculate'].includes(rule.action) && (
                        <div className="space-y-1">
                          <Label>Target Questions</Label>
                          <div className="p-2 border rounded-md space-y-1 max-h-40 overflow-y-auto">
                            {targetQuestions.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                No questions available after this one
                              </p>
                            ) : (
                              targetQuestions.map((q) => (
                                <label
                                  key={q.id}
                                  className="flex items-center gap-2 text-xs hover:bg-slate-100 p-1 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={rule.targetQuestionIds.includes(q.id)}
                                    onChange={(e) => {
                                      const newTargets = e.target.checked
                                        ? [...rule.targetQuestionIds, q.id]
                                        : rule.targetQuestionIds.filter(
                                            (id) => id !== q.id
                                          );
                                      handleUpdateRule(rule.id, {
                                        targetQuestionIds: newTargets,
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <span>
                                    {q.title || `Question ${q.order_index + 1}`}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canAddRule && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="w-full"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Advanced Rule
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
