'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import type { FileUploadOptions } from '@/lib/types/question.types';
import type { AnswerValue, UploadedFile } from '@/lib/types/response.types';
import { uploadFileAction, deleteFileAction } from '@/lib/actions/file-upload';

interface FileUploadInputProps {
  questionId: string;
  formId: string;
  options: FileUploadOptions;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string;
  ariaDescribedBy?: string;
  required?: boolean;
}

export function FileUploadInput({
  questionId,
  formId,
  options,
  value,
  onChange,
  error,
  ariaDescribedBy,
  required,
}: FileUploadInputProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(value.files || []);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (selectedFiles.length > 0 && !isUploading) {
      setIsUploading(true);
      const uploadFiles = async () => {
        const uploaded: UploadedFile[] = [];
        for (const file of selectedFiles) {
          try {
            const uploadedFile = await uploadFileAction(file, formId, questionId);
            uploaded.push(uploadedFile);
          } catch (err) {
            setUploadError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
            break;
          }
        }

        if (uploaded.length > 0) {
          const newUploadedFiles = [...uploadedFiles, ...uploaded];
          setUploadedFiles(newUploadedFiles);
          onChange({ ...value, files: newUploadedFiles });
        }
        setSelectedFiles([]);
        setIsUploading(false);
      };

      uploadFiles();
    }
  }, [selectedFiles, isUploading, questionId, formId, value, onChange, uploadedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    try {
      // Validation logic...
      const newSelectedFiles = [...selectedFiles, ...files];
      setSelectedFiles(newSelectedFiles);
    } catch (err) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError('File validation failed');
      }
    }
  };

  const handleRemoveFile = (index: number, type: 'pending' | 'uploaded') => {
    if (type === 'pending') {
      const newSelectedFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newSelectedFiles);
    } else {
      const fileToDelete = uploadedFiles[index];
      if (!fileToDelete) return;

      const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newUploadedFiles);
      onChange({ ...value, files: newUploadedFiles });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const input = document.getElementById(`${questionId}-file`) as HTMLInputElement;
    if (input) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:border-blue-400:border-blue-600 transition-colors"
        role="group"
        aria-labelledby={`${questionId}-title`}
        aria-describedby={ariaDescribedBy}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
            <label
              htmlFor={`${questionId}-file`}
              className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700"
            >
              Click to upload
            </label>
            <span className="text-sm text-slate-500"> or drag and drop</span>
            <input
              id={`${questionId}-file`}
              type="file"
              className="hidden"
              multiple={!!(options.maxFiles && options.maxFiles > 1)}
              accept={options.allowedFileTypes?.join(',') || options.acceptedExtensions}
              aria-required={required}
              aria-invalid={!!error}
              onChange={handleFileChange}
            />
            <p className="text-xs text-slate-500 mt-1">
              {options.allowedFileTypes && options.allowedFileTypes.length > 0
                ? options.allowedFileTypes.map((t) => t.replace('/*', '')).join(', ')
                : 'Any file type'}{' '}
              (max {options.maxFileSize || 10}MB)
            </p>
            <p className="text-xs text-slate-500">
              Up to {options.maxFiles || 1} {options.maxFiles === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600" role="alert">
          {uploadError}
        </p>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Selected Files:</Label>
          {selectedFiles.map((file, index) => (
            <div
              key={`pending-${index}`}
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{file.name}</span>
                <span className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index, 'pending')}
                className="ml-2 text-red-600 hover:text-red-700:text-red-300"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Uploaded Files:</Label>
          {uploadedFiles.map((file, index) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index, 'uploaded')}
                className="ml-2 text-red-600 hover:text-red-700:text-red-300"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

