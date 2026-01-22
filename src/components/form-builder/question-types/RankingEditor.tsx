/**
 * Ranking Question Editor
 * Configure items to be ranked with drag-and-drop
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { RankingOptions, RankingItem } from '@/lib/types/question.types';
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

import type { QuestionOptions } from '@/lib/types/question.types';
import { getRankingOptions } from '@/lib/utils/question-type-guards';

interface RankingEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

function SortableRankingItem({
  item,
  onUpdate,
  onDelete,
  canDelete,
}: {
  item: RankingItem;
  onUpdate: (label: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-md"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <Input
        value={item.label}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Item label"
        className="flex-1"
      />
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function RankingEditor({ options, onUpdate }: RankingEditorProps) {
  const rankingOptions = getRankingOptions(options);

  const [items, setItems] = useState<RankingItem[]>(
    rankingOptions.items || [
      { id: nanoid(), label: '' },
      { id: nanoid(), label: '' },
    ]
  );
  const [minRank, setMinRank] = useState(rankingOptions.minRank ?? undefined);
  const [maxRank, setMaxRank] = useState(rankingOptions.maxRank ?? undefined);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update parent when local state changes
  useEffect(() => {
    const newOptions: RankingOptions = {
      items,
      minRank: minRank || undefined,
      maxRank: maxRank || undefined,
    };
    onUpdate(newOptions);
  }, [items, minRank, maxRank, onUpdate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: nanoid(), label: '' }]);
  };

  const handleUpdateItem = (id: string, label: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, label } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const canDeleteItems = items.length > 2;

  return (
    <div className="space-y-4">
      {/* Items to Rank */}
      <div className="space-y-2">
        <Label>Items to Rank</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableRankingItem
                  key={item.id}
                  item={item}
                  onUpdate={(label) => handleUpdateItem(item.id, label)}
                  onDelete={() => handleDeleteItem(item.id)}
                  canDelete={canDeleteItems}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="w-full"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
        <p className="text-xs text-slate-500">
          Drag to reorder items. Respondents will rank these items.
        </p>
      </div>

      {/* Min/Max Rank Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ranking-min">Minimum Items to Rank (Optional)</Label>
          <Input
            id="ranking-min"
            type="number"
            value={minRank ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setMinRank(val === '' ? undefined : parseInt(val, 10));
            }}
            placeholder="No minimum"
            min="1"
            max={items.length}
          />
          <p className="text-xs text-slate-500">Require ranking at least this many</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ranking-max">Maximum Items to Rank (Optional)</Label>
          <Input
            id="ranking-max"
            type="number"
            value={maxRank ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setMaxRank(val === '' ? undefined : parseInt(val, 10));
            }}
            placeholder="Rank all"
            min="1"
            max={items.length}
          />
          <p className="text-xs text-slate-500">Limit ranking to this many items</p>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="text-sm font-medium mb-3 block">Preview</Label>
        <div className="p-4 bg-slate-50 rounded-md">
          <p className="text-xs text-slate-500 mb-3">
            Drag items to rank them
            {minRank && ` (minimum ${minRank})`}
            {maxRank && ` (maximum ${maxRank})`}
          </p>
          <div className="space-y-2">
            {items.slice(0, maxRank || items.length).map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-md"
              >
                <span className="text-sm font-medium text-slate-400">
                  #{index + 1}
                </span>
                <span className="flex-1 text-sm">{item.label || 'Untitled item'}</span>
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
