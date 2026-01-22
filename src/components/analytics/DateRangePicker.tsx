'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: 'all' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'custom';
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'All Time', value: 'all' as const },
    { label: 'Last 7 Days', value: 'last7days' as const },
    { label: 'Last 30 Days', value: 'last30days' as const },
    { label: 'Last 90 Days', value: 'last90days' as const },
    { label: 'This Month', value: 'thisMonth' as const },
    { label: 'Last Month', value: 'lastMonth' as const },
  ];

  const applyPreset = (preset: DateRange['preset']) => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (preset) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'all':
      default:
        startDate = null;
        endDate = null;
        break;
    }

    onChange({ startDate, endDate, preset });
    setIsOpen(false);
  };

  const formatDateRange = (): string => {
    if (value.preset === 'all') return 'All Time';

    const presetLabel = presets.find(p => p.value === value.preset)?.label;
    if (presetLabel && value.preset !== 'custom') return presetLabel;

    if (value.startDate && value.endDate) {
      const start = value.startDate.toLocaleDateString();
      const end = value.endDate.toLocaleDateString();
      return `${start} - ${end}`;
    }

    if (value.startDate) {
      return `From ${value.startDate.toLocaleDateString()}`;
    }

    if (value.endDate) {
      return `Until ${value.endDate.toLocaleDateString()}`;
    }

    return 'Select Date Range';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="grid gap-2 mt-2">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={value.preset === preset.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => applyPreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Custom Range</Label>
            <div className="grid gap-3 mt-2">
              <div>
                <Label htmlFor="start-date" className="text-xs text-slate-600">
                  Start Date
                </Label>
                <input
                  id="start-date"
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={value.startDate ? value.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newStart = e.target.value ? new Date(e.target.value) : null;
                    onChange({
                      startDate: newStart,
                      endDate: value.endDate,
                      preset: 'custom',
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-slate-600">
                  End Date
                </Label>
                <input
                  id="end-date"
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={value.endDate ? value.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newEnd = e.target.value ? new Date(e.target.value) : null;
                    onChange({
                      startDate: value.startDate,
                      endDate: newEnd,
                      preset: 'custom',
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
