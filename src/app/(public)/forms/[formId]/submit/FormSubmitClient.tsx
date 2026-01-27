'use client';

import { useState } from 'react';
import { FormRenderer } from '@/components/form-renderer/FormRenderer';
import { RespondentInfo } from '@/components/form-renderer/RespondentInfo';
import type { FormWithQuestions } from '@/lib/types/form.types';

interface FormSubmitClientProps {
  form: FormWithQuestions;
}

export function FormSubmitClient({ form }: FormSubmitClientProps) {
  const [respondentName, setRespondentName] = useState<string | null>(null);
  const [respondentEmail, setRespondentEmail] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleRespondentSubmit = (name: string, email: string) => {
    setRespondentName(name);
    setRespondentEmail(email);
    setShowForm(true);

    // Store in session storage for persistence during form fill
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`respondent_${form.id}_name`, name);
      sessionStorage.setItem(`respondent_${form.id}_email`, email);
    }
  };

  if (!showForm) {
    return (
      <RespondentInfo
        formTitle={form.title}
        formDescription={form.description || undefined}
        onSubmit={handleRespondentSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <FormRenderer
        form={form}
        mode={form.display_mode || 'scroll'}
        respondentName={respondentName || undefined}
        respondentEmail={respondentEmail || undefined}
      />
    </div>
  );
}
