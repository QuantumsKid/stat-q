'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuestionOptions, DateTimeOptions } from '@/lib/types/question.types';
import { getDateTimeOptions } from '@/lib/utils/question-type-guards';

interface DateTimeEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

export function DateTimeEditor({ options, onUpdate }: DateTimeEditorProps) {
  const dateTimeOptions = getDateTimeOptions(options);

  const [includeTime, setIncludeTime] = useState(
    dateTimeOptions.includeTime || false
  );
  const [minDate, setMinDate] = useState(dateTimeOptions.minDate || '');
  const [maxDate, setMaxDate] = useState(dateTimeOptions.maxDate || '');
  const [format, setFormat] = useState(dateTimeOptions.format || 'MM/DD/YYYY');

  // Validate date range
  const isValidDateRange = (): boolean => {
    if (!minDate || !maxDate) return true;
    return new Date(minDate) <= new Date(maxDate);
  };

  // Update parent when local state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if date range is valid
      if (!isValidDateRange()) {
        return;
      }

      const newOptions: DateTimeOptions = {
        includeTime,
        minDate: minDate || undefined,
        maxDate: maxDate || undefined,
        format,
      };

      onUpdate(newOptions);
    }, 500);

    return () => clearTimeout(timer);
  }, [includeTime, minDate, maxDate, format]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="include-time">Include Time</Label>
          <p className="text-xs text-slate-500">
            Ask for both date and time
          </p>
        </div>
        <Switch
          id="include-time"
          checked={includeTime}
          onCheckedChange={setIncludeTime}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Date Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger id="format">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minDate">Minimum Date (Optional)</Label>
        <Input
          id="minDate"
          type="date"
          value={minDate}
          onChange={(e) => setMinDate(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Earliest date respondents can select
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxDate">Maximum Date (Optional)</Label>
        <Input
          id="maxDate"
          type="date"
          value={maxDate}
          onChange={(e) => setMaxDate(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Latest date respondents can select
        </p>
        {minDate && maxDate && !isValidDateRange() && (
          <p className="text-xs text-red-600">
            Maximum date must be after minimum date
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="mb-2 block">Preview</Label>
        <div className="space-y-2">
          <Input
            type="date"
            disabled
            className="bg-slate-50"
          />
          {includeTime && (
            <Input
              type="time"
              disabled
              className="bg-slate-50"
            />
          )}
          <p className="text-xs text-slate-500">Format: {format}</p>
        </div>
      </div>
    </div>
  );
}
