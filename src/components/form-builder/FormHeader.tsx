'use client';

import { useState } from 'react';
import { ArrowLeft, Eye, Save, BarChart3, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { FormPreview } from './preview/FormPreview';
import type { Question } from '@/lib/types/question.types';

interface FormHeaderProps {
  formId: string;
  title: string;
  description?: string;
  isPublished: boolean;
  displayMode: 'single' | 'scroll';
  isSaving: boolean;
  lastSaved: Date | null;
  questions: Question[];
  hasResponses: boolean;
  responseCount: number;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPublishedChange: (published: boolean) => void;
  onDisplayModeChange: (mode: 'single' | 'scroll') => void;
}

export function FormHeader({
  formId,
  title,
  description,
  isPublished,
  displayMode,
  isSaving,
  lastSaved,
  questions,
  hasResponses,
  responseCount,
  onTitleChange,
  onDescriptionChange,
  onPublishedChange,
  onDisplayModeChange,
}: FormHeaderProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <FormPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        description={description}
        questions={questions}
        displayMode={displayMode}
      />
    <div className="sticky top-0 z-40 backdrop-blur-sm bg-white/90 border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        {/* Warning banner when form has responses */}
        {hasResponses && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Form has {responseCount} response{responseCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Editing or deleting questions may affect existing response data. Proceed with caution.
              </p>
            </div>
            <Lock className="h-5 w-5 text-yellow-600" />
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <nav id="navigation" className="flex items-center gap-4" aria-label="Form controls">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                  </span>
                </>
              ) : null}
            </div>

            {/* Display Mode Selector */}
            <div className="flex items-center gap-2">
              <Label htmlFor="display-mode" className="text-sm">
                Mode:
              </Label>
              <Select
                value={displayMode}
                onValueChange={(value) => onDisplayModeChange(value as 'single' | 'scroll')}
              >
                <SelectTrigger id="display-mode" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={onPublishedChange}
              />
              <Label htmlFor="published" className="cursor-pointer">
                {isPublished ? (
                  <Badge>Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </Label>
            </div>

            {/* View Responses Button */}
            <Link href={`/forms/${formId}/responses`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Responses
              </Button>
            </Link>

            {/* Preview Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              aria-label="Preview form"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </nav>
        </div>

        {/* Form Title and Description */}
        <div className="space-y-3">
          <Label htmlFor="form-title" className="sr-only">
            Form Title
          </Label>
          <Input
            id="form-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Form"
            className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-required="true"
          />
          <Label htmlFor="form-description" className="sr-only">
            Form Description
          </Label>
          <Textarea
            id="form-description"
            value={description || ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="resize-none border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
    </>
  );
}
