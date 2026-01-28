'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroupItem } from '@/components/ui/radio-group';
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
import type { QuestionOptions, MatrixOptions, MatrixItem } from '@/lib/types/question.types';
import { getMatrixOptions } from '@/lib/utils/question-type-guards';
import { nanoid } from 'nanoid';

interface MatrixEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

interface SortableItemProps {
  item: MatrixItem;
  onUpdate: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableItem({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: SortableItemProps) {
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

      <Input
        value={item.label}
        onChange={(e) => onUpdate(item.id, e.target.value)}
        placeholder="Item label"
        className="flex-1"
      />

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function MatrixEditor({ options, onUpdate }: MatrixEditorProps) {
  const matrixOptions = getMatrixOptions(options);

  const [rows, setRows] = useState<MatrixItem[]>(
    matrixOptions.rows || [
      { id: '1', label: 'Row 1' },
      { id: '2', label: 'Row 2' },
    ]
  );
  const [columns, setColumns] = useState<MatrixItem[]>(
    matrixOptions.columns || [
      { id: '1', label: 'Column 1' },
      { id: '2', label: 'Column 2' },
    ]
  );
  const [type, setType] = useState<'radio' | 'checkbox'>(
    matrixOptions.type || 'radio'
  );
  const [requiredRows, setRequiredRows] = useState<string[]>(
    matrixOptions.requiredRows || []
  );

  const rowsSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnsSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // CRITICAL: Sync local state with props when question changes
  useEffect(() => {
    const newMatrixOptions = getMatrixOptions(options);
    setRows(newMatrixOptions.rows || [
      { id: '1', label: 'Row 1' },
      { id: '2', label: 'Row 2' },
    ]);
    setColumns(newMatrixOptions.columns || [
      { id: '1', label: 'Column 1' },
      { id: '2', label: 'Column 2' },
    ]);
    setType(newMatrixOptions.type || 'radio');
    setRequiredRows(newMatrixOptions.requiredRows || []);
  }, [options]);

  // Update parent when local state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newOptions: MatrixOptions = {
        rows,
        columns,
        type,
        requiredRows: requiredRows.length > 0 ? requiredRows : undefined,
      };

      onUpdate(newOptions);
    }, 500);

    return () => clearTimeout(timer);
  }, [rows, columns, type, requiredRows]);

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      setRows(arrayMove(rows, oldIndex, newIndex));
    }
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      setColumns(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const handleAddRow = () => {
    setRows([...rows, { id: nanoid(), label: `Row ${rows.length + 1}` }]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
    // Also remove from required rows if it was required
    setRequiredRows(requiredRows.filter((rowId) => rowId !== id));
  };

  const handleToggleRequiredRow = (rowId: string) => {
    if (requiredRows.includes(rowId)) {
      setRequiredRows(requiredRows.filter((id) => id !== rowId));
    } else {
      setRequiredRows([...requiredRows, rowId]);
    }
  };

  const handleUpdateRow = (id: string, label: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, label } : r)));
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      { id: nanoid(), label: `Column ${columns.length + 1}` },
    ]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const handleUpdateColumn = (id: string, label: string) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="matrix-type">Matrix Type</Label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as 'radio' | 'checkbox')}
        >
          <SelectTrigger id="matrix-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="radio">Single Choice per Row</SelectItem>
            <SelectItem value="checkbox">Multiple Choice per Row</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Rows</Label>
        <DndContext
          sensors={rowsSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRowDragEnd}
        >
          <SortableContext
            items={rows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {rows.map((row) => (
                <SortableItem
                  key={row.id}
                  item={row}
                  onUpdate={handleUpdateRow}
                  onRemove={handleRemoveRow}
                  canRemove={rows.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="w-full"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>

      <div className="space-y-3">
        <Label>Columns</Label>
        <DndContext
          sensors={columnsSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {columns.map((column) => (
                <SortableItem
                  key={column.id}
                  item={column}
                  onUpdate={handleUpdateColumn}
                  onRemove={handleRemoveColumn}
                  canRemove={columns.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddColumn}
          className="w-full"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Required Rows */}
      <div className="space-y-3">
        <Label>Required Rows</Label>
        <p className="text-xs text-slate-500">
          Select which rows respondents must answer
        </p>
        <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center space-x-2">
              <Checkbox
                id={`required-${row.id}`}
                checked={requiredRows.includes(row.id)}
                onCheckedChange={() => handleToggleRequiredRow(row.id)}
              />
              <label
                htmlFor={`required-${row.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {row.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="mb-3 block">Preview</Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 p-2 bg-slate-50"></th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="border border-slate-200 p-2 text-sm font-medium bg-slate-50"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-slate-200 p-2 text-sm font-medium bg-slate-50">
                    {row.label}
                    {requiredRows.includes(row.id) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="border border-slate-200 p-2 text-center"
                    >
                      {type === 'radio' ? (
                        <RadioGroupItem
                          value={`${row.id}-${column.id}`}
                          disabled
                        />
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
      </div>
    </div>
  );
}
