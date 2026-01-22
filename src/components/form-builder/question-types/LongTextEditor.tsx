'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionOptions, LongTextOptions } from '@/lib/types/question.types';
import { getLongTextOptions } from '@/lib/utils/question-type-guards';

interface LongTextEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

export function LongTextEditor({ options, onUpdate }: LongTextEditorProps) {
  const longTextOptions = getLongTextOptions(options);

  const [placeholder, setPlaceholder] = useState(longTextOptions.placeholder || '');
  const [maxLength, setMaxLength] = useState<string>(
    longTextOptions.maxLength?.toString() || ''
  );
  const [rows, setRows] = useState<string>(
    longTextOptions.rows?.toString() || '4'
  );

  // Update parent when local state changes (debounced by parent's auto-save)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newOptions: LongTextOptions = {
        placeholder: placeholder || undefined,
        maxLength: maxLength ? parseInt(maxLength, 10) : undefined,
        rows: rows ? parseInt(rows, 10) : 4,
      };

      // Only update if something changed
      if (
        newOptions.placeholder !== longTextOptions.placeholder ||
        newOptions.maxLength !== longTextOptions.maxLength ||
        newOptions.rows !== longTextOptions.rows
      ) {
        onUpdate(newOptions);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [placeholder, maxLength, rows]);

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
          Shown inside the text area as a hint
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
        <Label htmlFor="rows">Number of Rows</Label>
        <Input
          id="rows"
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          placeholder="4"
          min="2"
          max="20"
        />
        <p className="text-xs text-slate-500">
          Height of the text area (2-20 rows)
        </p>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="mb-2 block">Preview</Label>
        <Textarea
          placeholder={placeholder || 'Your answer'}
          rows={parseInt(rows, 10) || 4}
          disabled
          className="bg-slate-50 resize-none"
        />
        {maxLength && (
          <p className="text-xs text-slate-500 mt-1">
            0 / {maxLength} characters
          </p>
        )}
      </div>
    </div>
  );
}
