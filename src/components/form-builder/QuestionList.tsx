'use client';

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
} from '@dnd-kit/sortable';
import { QuestionItem } from './QuestionItem';
import { AddQuestionButton } from './AddQuestionButton';
import { FileQuestion } from 'lucide-react';
import type { Question, QuestionType } from '@/lib/types/question.types';

interface QuestionListProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onReorderQuestions: (questions: Question[]) => void;
  onAddQuestion: (type: QuestionType) => void;
  onDuplicateQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onReorderQuestions,
  onAddQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const reordered = arrayMove(questions, oldIndex, newIndex);
      onReorderQuestions(reordered);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-12 px-4 backdrop-blur-sm bg-white/90 rounded-xl border-2 border-dashed border-slate-300">
          <div className="rounded-full bg-slate-100 p-6 mb-4">
            <FileQuestion className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No questions yet
          </h3>
          <p className="text-slate-600 text-center max-w-sm mb-6">
            Get started by adding your first question. Choose from 7 different question
            types to build your perfect form.
          </p>
          <div className="w-full max-w-xs">
            <AddQuestionButton onAddQuestion={onAddQuestion} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3" role="list" aria-label="Form questions">
            {questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                isSelected={selectedQuestionId === question.id}
                onSelect={() => onSelectQuestion(question.id)}
                onDuplicate={() => onDuplicateQuestion(question.id)}
                onDelete={() => onDeleteQuestion(question.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <AddQuestionButton onAddQuestion={onAddQuestion} />
    </div>
  );
}
