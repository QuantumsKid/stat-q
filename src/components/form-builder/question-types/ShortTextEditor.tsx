'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShortTextOptions, QuestionOptions } from '@/lib/types/question.types';
import { getShortTextOptions } from '@/lib/utils/question-type-guards';

interface ShortTextEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

export function ShortTextEditor({ options, onUpdate }: ShortTextEditorProps) {
  const shortTextOptions = getShortTextOptions(options);

  const [placeholder, setPlaceholder] = useState(shortTextOptions.placeholder || '');
  const [maxLength, setMaxLength] = useState<string>(
    shortTextOptions.maxLength?.toString() || ''
  );
  const [validationType, setValidationType] = useState<string>(
    shortTextOptions.validation || 'none'
  );

  // Update parent when local state changes (debounced by parent's auto-save)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newOptions: ShortTextOptions = {
        placeholder: placeholder || undefined,
        maxLength: maxLength ? parseInt(maxLength, 10) : undefined,
        validation: validationType === 'none' ? null : (validationType as 'email' | 'url' | 'number'),
      };

      // Only update if something changed
      if (
        newOptions.placeholder !== shortTextOptions.placeholder ||
        newOptions.maxLength !== shortTextOptions.maxLength ||
        newOptions.validation !== shortTextOptions.validation
      ) {
        onUpdate(newOptions);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [placeholder, maxLength, validationType]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="Enter placeholder text..."
        />
        <p className="text-xs text-slate-500">
          Shown inside the input field as a hint
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxLength">Maximum Length</Label>
        <Input
          id="maxLength"
          type="number"
          value={maxLength}
          onChange={(e) => setMaxLength(e.target.value)}
          placeholder="No limit"
          min="1"
        />
        <p className="text-xs text-slate-500">
          Maximum number of characters allowed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validationType">Validation Type</Label>
        <Select value={validationType} onValueChange={setValidationType}>
          <SelectTrigger id="validationType">
            <SelectValue placeholder="Select validation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Validate the format of the response
        </p>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="mb-2 block">Preview</Label>
        <Input
          placeholder={placeholder || 'Your answer'}
          disabled
          className="bg-slate-50"
        />
      </div>
    </div>
  );
}
