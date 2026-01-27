import { redirect } from 'next/navigation';
import { getPublishedForm } from './actions';
import { FormSubmitClient } from './FormSubmitClient';

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

  return <FormSubmitClient form={form} />;
}
