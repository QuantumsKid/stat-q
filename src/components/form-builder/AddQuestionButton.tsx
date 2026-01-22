'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QUESTION_TYPE_CONFIG, QUESTION_TYPES } from '@/lib/constants/question-types';
import type { QuestionType } from '@/lib/types/question.types';

interface AddQuestionButtonProps {
  onAddQuestion: (type: QuestionType) => void;
  disabled?: boolean;
}

export function AddQuestionButton({ onAddQuestion, disabled }: AddQuestionButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
          disabled={disabled}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuLabel>Select Question Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {QUESTION_TYPES.map((type) => {
          const config = QUESTION_TYPE_CONFIG[type];
          const Icon = config.icon;

          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onAddQuestion(type)}
              className="cursor-pointer"
            >
              <div className={`mr-3 ${config.bgColor} p-2 rounded-md`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{config.label}</span>
                <span className="text-xs text-slate-500">{config.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
