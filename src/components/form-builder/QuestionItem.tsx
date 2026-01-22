'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { QUESTION_TYPE_CONFIG } from '@/lib/constants/question-types';
import type { Question } from '@/lib/types/question.types';

interface QuestionItemProps {
  question: Question;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function QuestionItem({
  question,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: QuestionItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = QUESTION_TYPE_CONFIG[question.type];
  const Icon = config.icon;

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`group relative backdrop-blur-sm rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-slate-400 bg-slate-50 shadow-md'
            : 'border-slate-200 bg-white/90 hover:border-slate-300'
        } ${isDragging ? 'shadow-2xl scale-105' : ''}`}
        role="listitem"
      >
        <div className="flex items-start gap-3 p-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Drag to reorder question"
          >
            <GripVertical className="h-5 w-5 text-slate-400" />
          </button>

          {/* Question Icon */}
          <div className={`${config.bgColor} p-2 rounded-md flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
            <h4 className="font-medium text-slate-900 truncate">
              {question.title || 'Untitled Question'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              {question.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {question.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                {question.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="h-8 w-8"
              aria-label="Duplicate question"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Delete question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </li>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{question.title || 'Untitled Question'}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
