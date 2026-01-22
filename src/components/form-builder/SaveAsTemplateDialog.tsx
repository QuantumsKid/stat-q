'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertCircle } from 'lucide-react';
import type { Question } from '@/lib/types/question.types';
import type { FormTemplate } from '@/lib/constants/form-templates';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  formDescription?: string;
  questions: Question[];
  onSave: (template: Omit<FormTemplate, 'id'>) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'survey', label: 'Survey' },
  { value: 'registration', label: 'Registration' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'other', label: 'Other' },
] as const;

const ICON_OPTIONS = [
  '📋', '📝', '✅', '❓', '💡', '📊', '🎯', '🎓',
  '💼', '🎉', '📈', '🔍', '⭐', '🚀', '💬', '📱',
  '💻', '🎨', '🏆', '🌟', '🔔', '📌', '🎪', '🎭',
];

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  formTitle,
  formDescription,
  questions,
  onSave,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(formTitle || '');
  const [description, setDescription] = useState(formDescription || '');
  const [category, setCategory] = useState<'feedback' | 'survey' | 'registration' | 'quiz' | 'assessment' | 'other'>('other');
  const [icon, setIcon] = useState('📋');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!description.trim()) {
      setError('Template description is required');
      return;
    }

    if (questions.length === 0) {
      setError('Cannot save template with no questions');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      // Convert questions to template format
      const templateQuestions = questions.map(q => ({
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        options: q.options,
      }));

      const template: Omit<FormTemplate, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        category,
        icon,
        questions: templateQuestions,
      };

      await onSave(template);

      // Reset form
      setName('');
      setDescription('');
      setCategory('other');
      setIcon('📋');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this form as a reusable template for future use
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Feedback Survey"
            />
          </div>

          {/* Template Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description *</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger id="template-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="template-icon">Icon</Label>
            <div className="flex gap-2 flex-wrap p-3 border rounded-lg bg-slate-50">
              {ICON_OPTIONS.map((iconOption) => (
                <button
                  key={iconOption}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={`text-2xl p-2 rounded hover:bg-slate-200 transition-colors ${
                    icon === iconOption
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : ''
                  }`}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              This template will include <strong>{questions.length} questions</strong> with their
              current configuration (options, validation, logic rules).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
