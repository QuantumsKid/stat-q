'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, X, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { QuestionOptions, ChoiceOptions, Choice } from '@/lib/types/question.types';
import {
  addOption,
  removeOption,
  updateOption,
  toggleOtherOption,
} from '@/lib/utils/question-utils';
import { getChoiceOptions } from '@/lib/utils/question-type-guards';

interface DropdownEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

interface SortableOptionItemProps {
  option: Choice;
  index: number;
  onUpdate: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableOptionItem({
  option,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <div className="text-sm text-slate-500 w-6">{index + 1}.</div>
        <Input
          value={option.label}
          onChange={(e) => onUpdate(option.id, e.target.value)}
          placeholder="Option label"
          disabled={option.isOther}
          className="flex-1"
        />
      </div>

      {canRemove && !option.isOther && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(option.id)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function DropdownEditor({ options, onUpdate }: DropdownEditorProps) {
  const choiceOptions = getChoiceOptions(options);

  const [choices, setChoices] = useState<Choice[]>(
    choiceOptions.choices || [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3' },
    ]
  );
  const [allowOther, setAllowOther] = useState(
    choiceOptions.allowOther || false
  );
  const [randomize, setRandomize] = useState(
    choiceOptions.randomizeOptions || false
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setHasUnsavedChanges(true);

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to auto-save
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1000);

    // Cleanup on unmount or before next effect
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [choices, allowOther, randomize]);

  // Save immediately when component unmounts (switching questions)
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) {
        // Save immediately without waiting
        const newOptions: ChoiceOptions = {
          choices,
          allowOther,
          randomizeOptions: randomize,
        };
        onUpdate(newOptions);
      }
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return; // Prevent concurrent saves

    setIsSaving(true);
    const newOptions: ChoiceOptions = {
      choices,
      allowOther,
      randomizeOptions: randomize,
    };

    try {
      await onUpdate(newOptions);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving options:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = choices.findIndex((c) => c.id === active.id);
      const newIndex = choices.findIndex((c) => c.id === over.id);

      setChoices(arrayMove(choices, oldIndex, newIndex));
    }
  };

  const handleAddOption = () => {
    setChoices(addOption(choices, 'Option'));
  };

  const handleRemoveOption = (id: string) => {
    setChoices(removeOption(choices, id));
  };

  const handleUpdateOption = (id: string, label: string) => {
    setChoices(updateOption(choices, id, { label }));
  };

  const handleToggleOther = (enabled: boolean) => {
    setAllowOther(enabled);
    setChoices(toggleOtherOption(choices, enabled));
  };

  const canRemove = choices.filter((c) => !c.isOther).length > 1;

  // Check for duplicate labels
  const duplicateLabels = choices
    .map((c) => c.label.trim().toLowerCase())
    .filter((label, index, arr) => label && arr.indexOf(label) !== index);
  const hasDuplicates = duplicateLabels.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Options</Label>
        {hasDuplicates && (
          <p className="text-xs text-amber-600">
            Warning: Multiple options have the same label
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={choices.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <SortableOptionItem
                  key={choice.id}
                  option={choice}
                  index={index}
                  onUpdate={handleUpdateOption}
                  onRemove={handleRemoveOption}
                  canRemove={canRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="w-full"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="allow-other">Allow &quot;Other&quot;</Label>
          <p className="text-xs text-slate-500">
            Let respondents add their own option
          </p>
        </div>
        <Switch
          id="allow-other"
          checked={allowOther}
          onCheckedChange={handleToggleOther}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="randomize">Randomize Options</Label>
          <p className="text-xs text-slate-500">
            Shuffle the order for each respondent
          </p>
        </div>
        <Switch
          id="randomize"
          checked={randomize}
          onCheckedChange={setRandomize}
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          {hasUnsavedChanges && !isSaving && (
            <p className="text-sm text-amber-600">Unsaved changes</p>
          )}
          {isSaving && (
            <p className="text-sm text-blue-600">Saving...</p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          type="button"
          size="sm"
        >
          {isSaving ? 'Saving...' : 'Save Options'}
        </Button>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="mb-2 block">Preview</Label>
        <Select disabled>
          <SelectTrigger className="bg-slate-50">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
