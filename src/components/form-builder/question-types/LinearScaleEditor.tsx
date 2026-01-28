'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuestionOptions, LinearScaleOptions } from '@/lib/types/question.types';
import { getLinearScaleOptions } from '@/lib/utils/question-type-guards';
import { LINEAR_SCALE_MAX_VALUES } from '@/lib/constants/question-limits';

interface LinearScaleEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

export function LinearScaleEditor({
  options,
  onUpdate,
}: LinearScaleEditorProps) {
  const scaleOptions = getLinearScaleOptions(options);

  const [min, setMin] = useState<string>(scaleOptions.min?.toString() || '1');
  const [max, setMax] = useState<string>(scaleOptions.max?.toString() || '5');
  const [minLabel, setMinLabel] = useState(scaleOptions.minLabel || '');
  const [maxLabel, setMaxLabel] = useState(scaleOptions.maxLabel || '');
  const [step, setStep] = useState<string>(scaleOptions.step?.toString() || '1');

  // CRITICAL: Sync local state with props when question changes
  useEffect(() => {
    const newScaleOptions = getLinearScaleOptions(options);
    setMin(newScaleOptions.min?.toString() || '1');
    setMax(newScaleOptions.max?.toString() || '5');
    setMinLabel(newScaleOptions.minLabel || '');
    setMaxLabel(newScaleOptions.maxLabel || '');
    setStep(newScaleOptions.step?.toString() || '1');
  }, [options]);

  // Validate step immediately - must divide the range evenly
  const validateStep = (minVal: number, maxVal: number, stepVal: number): boolean => {
    if (stepVal < 1) return false;
    const range = maxVal - minVal;
    if (stepVal > range) return false;
    // Check if step divides the range evenly
    if (range % stepVal !== 0) return false;
    return true;
  };

  // Update parent when local state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const minNum = parseInt(min, 10) || 1;
      const maxNum = parseInt(max, 10) || 5;
      const stepNum = parseInt(step, 10) || 1;

      // Ensure max is greater than min
      if (maxNum <= minNum) {
        return;
      }

      // Validate step
      if (!validateStep(minNum, maxNum, stepNum)) {
        return;
      }

      const newOptions: LinearScaleOptions = {
        min: minNum,
        max: maxNum,
        minLabel: minLabel || undefined,
        maxLabel: maxLabel || undefined,
        step: stepNum,
      };

      onUpdate(newOptions);
    }, 300); // Reduced from 500ms to 300ms for faster response

    return () => clearTimeout(timer);
  }, [min, max, minLabel, maxLabel, step]);

  // Generate scale values for preview
  const generateScaleValues = () => {
    const minNum = parseInt(min, 10) || 1;
    const maxNum = parseInt(max, 10) || 5;
    const stepNum = parseInt(step, 10) || 1;

    if (maxNum <= minNum) return [];

    const values: number[] = [];
    for (let i = minNum; i <= maxNum; i += stepNum) {
      values.push(i);
      if (values.length > LINEAR_SCALE_MAX_VALUES) break;
    }
    return values;
  };

  const scaleValues = generateScaleValues();

  const minNum = parseInt(min, 10) || 1;
  const maxNum = parseInt(max, 10) || 5;
  const stepNum = parseInt(step, 10) || 1;
  const isStepValid = validateStep(minNum, maxNum, stepNum);
  const isRangeValid = maxNum > minNum;
  const hasMinMaxError = min !== '' && max !== '' && !isRangeValid;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum Value</Label>
                <Input
                  id="min"
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="1"
                  className={hasMinMaxError ? 'border-red-500' : ''}
                />
                {hasMinMaxError && (
                  <p className="text-xs text-red-600">
                    Must be less than maximum
                  </p>
                )}
              </div>
        
              <div className="space-y-2">
                <Label htmlFor="max">Maximum Value</Label>
                <Input
                  id="max"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="5"
                  className={hasMinMaxError ? 'border-red-500' : ''}
                />
                {hasMinMaxError && (
                  <p className="text-xs text-red-600">
                    Must be greater than minimum
                  </p>
                )}
              </div>
            </div>
        
            <div className="space-y-2">
              <Label htmlFor="step">Step</Label>
              <Input
                id="step"
                type="number"
                value={step}
                onChange={(e) => setStep(e.target.value)}
                placeholder="1"
                min="1"
                className={!isStepValid && maxNum > minNum ? 'border-red-500' : ''}
              />
              {!isStepValid && maxNum > minNum ? (
                <p className="text-xs text-red-600">
                  Step must evenly divide the range ({maxNum - minNum}). Try: {[1, 2, 3, 4, 5].filter(s => (maxNum - minNum) % s === 0 && s <= (maxNum - minNum)).slice(0, 3).join(', ')}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Increment between scale values
                </p>
              )}
            </div>
        
            <div className="space-y-2">
              <Label htmlFor="minLabel">Minimum Label (Optional)</Label>
              <Input
                id="minLabel"
                value={minLabel}
                onChange={(e) => setMinLabel(e.target.value)}
                placeholder="e.g., Not at all"
              />
            </div>
        
            <div className="space-y-2">
              <Label htmlFor="maxLabel">Maximum Label (Optional)</Label>
              <Input
                id="maxLabel"
                value={maxLabel}
                onChange={(e) => setMaxLabel(e.target.value)}
                placeholder="e.g., Extremely"
              />
            </div>
        
            {/* Preview */}
            <div className="pt-4 border-t border-slate-200">
              <Label className="mb-3 block">Preview</Label>
              {scaleValues.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{minLabel || min}</span>
                    <span>{maxLabel || max}</span>
                  </div>
                  <RadioGroup disabled className="flex justify-between">
                    {scaleValues.map((value) => (
                      <div
                        key={value}
                        className="flex flex-col items-center space-y-2"
                      >
                        <RadioGroupItem value={value.toString()} />
                        <Label className="text-xs font-normal">{value}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Invalid scale range. Max must be greater than min.
                </p>
              )}
            </div>
          </div>
        );
        }
