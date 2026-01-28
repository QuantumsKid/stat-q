import { notFound } from 'next/navigation';
import { getFormWithQuestions } from './actions';
import { FormBuilderWrapper } from '@/components/form-builder/FormBuilderWrapper';

interface FormEditorPageProps {
  params: Promise<{ formId: string }>;
}

export default async function FormEditorPage({ params }: FormEditorPageProps) {
  const { formId } = await params;

  const form = await getFormWithQuestions(formId);

  if (!form) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <FormBuilderWrapper form={form} />
    </div>
  );
}
