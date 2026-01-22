/**
 * File Upload Question Editor
 * Configure file upload constraints and accepted file types
 */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { QuestionOptions, FileUploadOptions } from '@/lib/types/question.types';
import { getFileUploadOptions } from '@/lib/utils/question-type-guards';

interface FileUploadEditorProps {
  options: QuestionOptions | undefined;
  onUpdate: (options: QuestionOptions) => void;
}

const FILE_TYPE_PRESETS = [
  { label: 'Images', value: 'image/*', extensions: '.jpg,.jpeg,.png,.gif,.webp' },
  { label: 'Documents', value: 'application/pdf', extensions: '.pdf,.doc,.docx,.txt' },
  { label: 'Spreadsheets', value: 'application/vnd.ms-excel', extensions: '.xls,.xlsx,.csv' },
  { label: 'Videos', value: 'video/*', extensions: '.mp4,.mov,.avi,.wmv' },
  { label: 'Audio', value: 'audio/*', extensions: '.mp3,.wav,.ogg,.m4a' },
];

export function FileUploadEditor({ options, onUpdate }: FileUploadEditorProps) {
  const fileOptions = getFileUploadOptions(options);

  const [maxFileSize, setMaxFileSize] = useState(fileOptions.maxFileSize ?? 10);
  const [maxFiles, setMaxFiles] = useState(fileOptions.maxFiles ?? 1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    fileOptions.allowedFileTypes || []
  );
  const [customExtensions, setCustomExtensions] = useState(
    fileOptions.acceptedExtensions || ''
  );

  // Update parent when local state changes
  useEffect(() => {
    const newOptions: FileUploadOptions = {
      maxFileSize,
      maxFiles,
      allowedFileTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      acceptedExtensions: customExtensions || undefined,
    };
    onUpdate(newOptions);
  }, [maxFileSize, maxFiles, selectedTypes, customExtensions, onUpdate]);

  const handleTypeToggle = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, value]);
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== value));
    }
  };

  return (
    <div className="space-y-4">
      {/* Max File Size */}
      <div className="space-y-2">
        <Label htmlFor="file-max-size">Maximum File Size (MB)</Label>
        <Input
          id="file-max-size"
          type="number"
          value={maxFileSize}
          onChange={(e) => setMaxFileSize(parseInt(e.target.value, 10) || 10)}
          min="1"
          max="100"
        />
        <p className="text-xs text-slate-500">
          Maximum size per file (1-100 MB)
        </p>
      </div>

      {/* Max Files */}
      <div className="space-y-2">
        <Label htmlFor="file-max-count">Maximum Number of Files</Label>
        <Input
          id="file-max-count"
          type="number"
          value={maxFiles}
          onChange={(e) => setMaxFiles(parseInt(e.target.value, 10) || 1)}
          min="1"
          max="10"
        />
        <p className="text-xs text-slate-500">
          How many files can be uploaded (1-10)
        </p>
      </div>

      {/* Allowed File Types */}
      <div className="space-y-2">
        <Label>Allowed File Types</Label>
        <div className="space-y-2">
          {FILE_TYPE_PRESETS.map((preset) => (
            <div key={preset.value} className="flex items-center space-x-2">
              <Checkbox
                id={`file-type-${preset.value}`}
                checked={selectedTypes.includes(preset.value)}
                onCheckedChange={(checked) =>
                  handleTypeToggle(preset.value, checked as boolean)
                }
              />
              <label
                htmlFor={`file-type-${preset.value}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {preset.label}
                <span className="text-xs text-slate-500 ml-2">
                  ({preset.extensions})
                </span>
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Select which types of files are allowed
        </p>
      </div>

      {/* Custom Extensions */}
      <div className="space-y-2">
        <Label htmlFor="file-custom-extensions">
          Custom File Extensions (Optional)
        </Label>
        <Input
          id="file-custom-extensions"
          value={customExtensions}
          onChange={(e) => setCustomExtensions(e.target.value)}
          placeholder=".pdf,.doc,.docx"
        />
        <p className="text-xs text-slate-500">
          Comma-separated list of custom extensions (e.g., .pdf,.doc,.docx)
        </p>
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> File uploads require Supabase Storage configuration.
          Uploaded files will be stored securely and associated with form responses.
        </p>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-slate-200">
        <Label className="text-sm font-medium mb-3 block">Preview</Label>
        <div className="p-4 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                {selectedTypes.length > 0
                  ? selectedTypes.map((t) => t.replace('/*', '')).join(', ')
                  : 'Any file type'}{' '}
                (max {maxFileSize}MB)
              </p>
              <p className="text-xs text-slate-500">
                Up to {maxFiles} {maxFiles === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
