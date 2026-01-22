'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Label } from '@/components/ui/label';
import { GripVertical } from 'lucide-react';
import type { RankingOptions } from '@/lib/types/question.types';
import type { AnswerValue } from '@/lib/types/response.types';

interface RankingInputProps {
  questionId: string;
  options: RankingOptions;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  ariaDescribedBy?: string;
}

interface SortableRankedItemProps {
  itemId: string;
  label: string;
  rank: number;
  onRemove: () => void;
}

function SortableRankedItem({ itemId, label, rank, onRemove }: SortableRankedItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg border-2 border-slate-300"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-slate-400" />
      </div>
      <span className="font-bold text-lg text-slate-600">#{rank}</span>
      <span className="flex-1">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-600 hover:text-red-700:text-red-300 px-2 py-1"
      >
        Remove
      </button>
    </div>
  );
}

export function RankingInput({
  questionId,
  options,
  value,
  onChange,
  ariaDescribedBy,
}: RankingInputProps) {
  const rankedItems = value.ranked_items || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rankedItems.indexOf(active.id as string);
      const newIndex = rankedItems.indexOf(over.id as string);

      const newRankedItems = arrayMove(rankedItems, oldIndex, newIndex);
      onChange({ ranked_items: newRankedItems });
    }
  };

  const handleAddItem = (itemId: string) => {
    onChange({ ranked_items: [...rankedItems, itemId] });
  };

  const handleRemoveItem = (itemId: string) => {
    const newRankedItems = rankedItems.filter((id) => id !== itemId);
    onChange({ ranked_items: newRankedItems });
  };

  const unrankedItems =
    options.items?.filter((item) => !rankedItems.includes(item.id)) || [];

  return (
    <div
      className="space-y-4"
      role="group"
      aria-labelledby={`${questionId}-title`}
      aria-describedby={ariaDescribedBy}
    >
      {rankedItems.length > 0 && (
        <div className="space-y-2">
          <Label>Your ranking (drag to reorder):</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rankedItems} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {rankedItems.map((itemId, index) => {
                  const item = options.items?.find((i) => i.id === itemId);
                  if (!item) return null;

                  return (
                    <SortableRankedItem
                      key={itemId}
                      itemId={itemId}
                      label={item.label}
                      rank={index + 1}
                      onRemove={() => handleRemoveItem(itemId)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {unrankedItems.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-slate-500">
            {rankedItems.length === 0 ? 'Click items to start ranking:' : 'Add more items:'}
          </Label>
          <div className="space-y-1">
            {unrankedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddItem(item.id)}
                className="w-full text-left p-2 bg-white border border-slate-200 rounded hover:bg-slate-50:bg-slate-800 hover:border-blue-400:border-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {options.minRank && rankedItems.length < options.minRank && (
        <p className="text-xs text-amber-600" role="alert">
          Please rank at least {options.minRank} items (currently ranked: {rankedItems.length})
        </p>
      )}

      {options.maxRank && rankedItems.length > options.maxRank && (
        <p className="text-xs text-red-600" role="alert">
          Maximum {options.maxRank} items allowed (currently ranked: {rankedItems.length})
        </p>
      )}
    </div>
  );
}
