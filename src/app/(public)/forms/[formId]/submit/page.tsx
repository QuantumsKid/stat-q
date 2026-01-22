import { redirect } from 'next/navigation';
import { getPublishedForm } from './actions';
import { FormRenderer } from '@/components/form-renderer/FormRenderer';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function FormSubmitPage({ params }: PageProps) {
  const { formId } = await params;

  const result = await getPublishedForm(formId);

  if (result.error || !result.data) {
    redirect('/404');
  }

  const form = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <FormRenderer
        form={form}
        mode={form.display_mode || 'scroll'}
      />
    </div>
  );
}
