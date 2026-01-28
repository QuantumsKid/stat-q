'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAutosave } from '@/hooks/use-autosave';
import { updateQuestion } from '@/app/(dashboard)/forms/[formId]/edit/actions';
import { toast } from 'sonner';
import type { Question, QuestionOptions } from '@/lib/types/question.types';
import { ShortTextEditor } from './question-types/ShortTextEditor';
import { LongTextEditor } from './question-types/LongTextEditor';
import { MultipleChoiceEditor } from './question-types/MultipleChoiceEditor';
import { CheckboxesEditor } from './question-types/CheckboxesEditor';
import { DropdownEditor } from './question-types/DropdownEditor';
import { LinearScaleEditor } from './question-types/LinearScaleEditor';
import { MatrixEditor } from './question-types/MatrixEditor';
import { DateTimeEditor } from './question-types/DateTimeEditor';
import { LogicBuilder } from './conditional-logic/LogicBuilder';
import { AdvancedLogicBuilder } from './conditional-logic/AdvancedLogicBuilder';
import type { LogicRule } from '@/lib/types/question.types';
import type { AdvancedLogicRule } from '@/lib/types/advanced-logic.types';
import { detectCircularLogic } from '@/lib/utils/logic-evaluator';
import { validateAdvancedLogicRules } from '@/lib/utils/advanced-logic-evaluator';

interface QuestionEditorProps {
  question: Question;
  allQuestions: Question[];
  onUpdate: (updates: Partial<Question>) => void;
}

export function QuestionEditor({ question, allQuestions, onUpdate }: QuestionEditorProps) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || '');
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState(question.options || {});
  const [logicRules, setLogicRules] = useState<LogicRule[]>(
    question.logic_rules || []
  );
  const [advancedLogicRules, setAdvancedLogicRules] = useState<AdvancedLogicRule[]>(
    (question.advanced_logic_rules as AdvancedLogicRule[]) || []
  );

  // Update local state when question changes
  useEffect(() => {
    console.log('[QuestionEditor] useEffect triggered, updating local state from question:', question.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(question.title);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescription(question.description || '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequired(question.required);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptions(question.options || {});
    console.log('[QuestionEditor] Set options to:', question.options);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogicRules(question.logic_rules || []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdvancedLogicRules((question.advanced_logic_rules as AdvancedLogicRule[]) || []);
  }, [question.id, question.title, question.description, question.required, JSON.stringify(question.options), JSON.stringify(question.logic_rules), JSON.stringify(question.advanced_logic_rules)]);

  // Auto-save common fields
  const { isSaving } = useAutosave(
    { title, description, required },
    async (data) => {
      const result = await updateQuestion(question.id, data);
      if (result.error) {
        toast.error(result.error);
      } else {
        onUpdate(data);
      }
    }
  );

  // Handle options updates
  const handleOptionsUpdate = async (newOptions: QuestionOptions) => {
    console.log('[QuestionEditor] handleOptionsUpdate called with:', newOptions);
    setOptions(newOptions);
    console.log('[QuestionEditor] Calling updateQuestion with options:', newOptions);
    const result = await updateQuestion(question.id, { options: newOptions });
    console.log('[QuestionEditor] updateQuestion result:', result);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      console.log('[QuestionEditor] Save successful, returned options:', result.data.options);
      onUpdate({ options: result.data.options });
      toast.success('Saved', { duration: 1000 });
    }
  };

  // Handle logic rules updates
  const handleLogicRulesChange = async (newRules: LogicRule[]) => {
    // Create temporary questions array with the new rules to test for circular logic
    const updatedQuestions = allQuestions.map((q) =>
      q.id === question.id ? { ...q, logic_rules: newRules } : q
    );

    // Check for circular dependencies
    const circularQuestionIds = detectCircularLogic(updatedQuestions);
    if (circularQuestionIds.includes(question.id)) {
      toast.error(
        'Cannot save: This logic rule creates a circular dependency. Please remove the conflicting rule.',
        { duration: 5000 }
      );
      return; // Prevent saving
    }

    setLogicRules(newRules);
    const result = await updateQuestion(question.id, { logic_rules: newRules });
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onUpdate({ logic_rules: result.data.logic_rules });
      toast.success('Logic updated', { duration: 1000 });
    }
  };

  // Handle advanced logic rules updates
  const handleAdvancedLogicRulesChange = async (newRules: AdvancedLogicRule[]) => {
    // Validate advanced logic rules for circular dependencies
    const validation = validateAdvancedLogicRules(newRules, allQuestions);
    if (!validation.valid) {
      const circularQuestions = validation.circularQuestionIds
        .map((id) => {
          const q = allQuestions.find((question) => question.id === id);
          return q?.title || `Question ${q?.order_index ? q.order_index + 1 : ''}`;
        })
        .join(', ');

      toast.error(
        `Cannot save: Circular dependency detected in questions: ${circularQuestions}`,
        { duration: 5000 }
      );
      return;
    }

    setAdvancedLogicRules(newRules);
    const result = await updateQuestion(question.id, { advanced_logic_rules: newRules as any[] });
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onUpdate({ advanced_logic_rules: result.data.advanced_logic_rules });
      toast.success('Advanced logic updated', { duration: 1000 });
    }
  };

  // Render type-specific editor
  const renderTypeEditor = () => {
    switch (question.type) {
      case 'short_text':
        return (
          <ShortTextEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'long_text':
        return (
          <LongTextEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'checkboxes':
        return (
          <CheckboxesEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'dropdown':
        return (
          <DropdownEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'linear_scale':
        return (
          <LinearScaleEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'matrix':
        return (
          <MatrixEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      case 'date_time':
        return (
          <DateTimeEditor
            options={options}
            onUpdate={handleOptionsUpdate}
          />
        );
      default:
        return (
          <div className="text-center py-4 text-sm text-slate-500">
            Editor for {question.type} coming soon
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Saving indicator */}
      {isSaving && (
        <div className="text-xs text-slate-500 animate-pulse">
          Saving...
        </div>
      )}

      {/* Common Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question-title">Question Title</Label>
          <Input
            id="question-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your question"
            className="font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-description">Description (Optional)</Label>
          <Textarea
            id="question-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to help respondents"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="question-required">Required</Label>
            <p className="text-xs text-slate-500">
              Respondents must answer this question
            </p>
          </div>
          <Switch
            id="question-required"
            checked={required}
            onCheckedChange={setRequired}
          />
        </div>
      </div>

      {/* Type-Specific Editor */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-sm font-medium mb-4">Question Settings</h4>
        {renderTypeEditor()}
      </div>

      {/* Conditional Logic */}
      <div className="pt-4 border-t border-slate-200">
        <LogicBuilder
          currentQuestion={question}
          allQuestions={allQuestions}
          rules={logicRules}
          onRulesChange={handleLogicRulesChange}
        />
      </div>

      {/* Advanced Conditional Logic */}
      <div className="pt-4 border-t border-slate-200">
        <AdvancedLogicBuilder
          currentQuestion={question}
          allQuestions={allQuestions}
          rules={advancedLogicRules}
          onRulesChange={handleAdvancedLogicRulesChange}
        />
      </div>
    </div>
  );
}
