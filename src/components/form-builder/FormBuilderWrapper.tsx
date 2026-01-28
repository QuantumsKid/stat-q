'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from './FormBuilder';
import type { FormWithQuestions } from '@/lib/types/form.types';

interface FormBuilderWrapperProps {
  form: FormWithQuestions;
}

export function FormBuilderWrapper({ form }: FormBuilderWrapperProps) {
  const router = useRouter();

  // Refresh data when page regains focus (user comes back from another tab)
  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router]);

  return <FormBuilder form={form} />;
}
