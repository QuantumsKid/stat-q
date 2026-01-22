'use client';

import { useState } from 'react';
import { FileUploadInput } from '@/components/form-renderer/FileUploadInput';
import type { AnswerValue } from '@/lib/types/response.types';

export default function TestFileUploadPage() {
  const [value, setValue] = useState<AnswerValue>({});
  const formId = 'test_form_id'; // Hardcoded formId for testing

  const options = {
    maxFiles: 5,
    maxFileSize: 10,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">File Upload Test</h1>
      <div className="max-w-md">
        <FileUploadInput
          questionId="test-file-upload"
          formId={formId}
          options={options}
          value={value}
          onChange={setValue}
        />
      </div>
      <div className="mt-8 p-4 bg-slate-100 rounded">
        <h2 className="text-lg font-semibold">Current Value</h2>
        <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
}
