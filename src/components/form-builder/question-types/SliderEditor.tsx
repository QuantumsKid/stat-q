/**
 * Slider Question Editor
 * Configure slider with min/max values, step, and labels
 */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { QuestionOptions, SliderOptions } from '@/lib/types/question.types';
import { getSliderOptions } from '@/lib/utils/question-type-guards';

interface SliderEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

export function SliderEditor({ options, onUpdate }: SliderEditorProps) {
  const sliderOptions = getSliderOptions(options);

  const [min, setMin] = useState(sliderOptions.min ?? 0);
  const [max, setMax] = useState(sliderOptions.max ?? 100);
  const [step, setStep] = useState(sliderOptions.step ?? 1);
  const [minLabel, setMinLabel] = useState(sliderOptions.minLabel || '');
  const [maxLabel, setMaxLabel] = useState(sliderOptions.maxLabel || '');
  const [showValue, setShowValue] = useState(sliderOptions.showValue ?? true);
  const [defaultValue, setDefaultValue] = useState(sliderOptions.defaultValue ?? undefined);

  // Update parent when local state changes
  useEffect(() => {
    const newOptions: SliderOptions = {
      min,
      max,
      step,
      minLabel: minLabel || undefined,
      maxLabel: maxLabel || undefined,
      showValue,
      defaultValue: defaultValue ?? undefined,
    };
    onUpdate(newOptions);
  }, [min, max, step, minLabel, maxLabel, showValue, defaultValue, onUpdate]);

  // Validate that min < max
  const isRangeValid = min < max;
  const isStepValid = step > 0 && step <= (max - min);
  const isDefaultValid = defaultValue === undefined || (defaultValue >= min && defaultValue <= max);

  return (
    <div className="space-y-4">
      {/* Min and Max Values */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slider-min">Minimum Value</Label>
          <Input
            id="slider-min"
            type="number"
            value={min}
            onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
            className={!isRangeValid ? 'border-red-500' : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slider-max">Maximum Value</Label>
          <Input
            id="slider-max"
            type="number"
            value={max}
            onChange={(e) => setMax(parseFloat(e.target.value) || 100)}
            className={!isRangeValid ? 'border-red-500' : ''}
          />
        </div>
      </div>

      {!isRangeValid && (
        <p className="text-xs text-red-600">Minimum must be less than maximum</p>
      )}

      {/* Step */}
      <div className="space-y-2">
        <Label htmlFor="slider-step">Step Size</Label>
        <Input
          id="slider-step"
          type="number"
          value={step}
          onChange={(e) => setStep(parseFloat(e.target.value) || 1)}
          min="0.01"
          step="0.01"
          className={!isStepValid ? 'border-red-500' : ''}
        />
        {!isStepValid && (
          <p className="text-xs text-red-600">
            Step must be positive and not greater than the range
          </p>
        )}
        <p className="text-xs text-slate-500">Increment between slider values</p>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slider-min-label">Min Label (Optional)</Label>
          <Input
            id="slider-min-label"
            value={minLabel}
            onChange={(e) => setMinLabel(e.target.value)}
            placeholder={`e.g., "${min}"`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slider-max-label">Max Label (Optional)</Label>
          <Input
            id="slider-max-label"
            value={maxLabel}
            onChange={(e) => setMaxLabel(e.target.value)}
            placeholder={`e.g., "${max}"`}
          />
        </div>
      </div>

      {/* Default Value */}
      <div className="space-y-2">
        <Label htmlFor="slider-default">Default Value (Optional)</Label>
        <Input
          id="slider-default"
          type="number"
          value={defaultValue ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setDefaultValue(val === '' ? undefined : parseFloat(val));
          }}
          placeholder="No default"
          min={min}
          max={max}
          step={step}
          className={!isDefaultValid ? 'border-red-500' : ''}
        />
        {!isDefaultValid && (
          <p className="text-xs text-red-600">
            Default value must be between {min} and {max}
          </p>
        )}
        <p className="text-xs text-slate-500">Pre-set slider position</p>
      </div>

      {/* Show Value Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
        <div className="space-y-0.5">
          <Label htmlFor="slider-show-value">Show Current Value</Label>
          <p className="text-xs text-slate-500">Display value as user drags slider</p>
        </div>
        <Switch
          id="slider-show-value"
          checked={showValue}
          onCheckedChange={setShowValue}
        />
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="text-sm font-medium mb-3 block">Preview</Label>
        <div className="p-4 bg-slate-50 rounded-md space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{minLabel || min}</span>
            <span>{maxLabel || max}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            defaultValue={defaultValue ?? (min + max) / 2}
            className="w-full"
            disabled
          />
          {showValue && (
            <div className="text-center text-sm font-medium">
              Value: {defaultValue ?? Math.round((min + max) / 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
