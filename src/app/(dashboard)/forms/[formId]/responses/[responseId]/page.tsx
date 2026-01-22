import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ResponseDetail } from '@/components/analytics/ResponseDetail';
import { getResponseById } from '../actions';

interface PageProps {
  params: Promise<{ formId: string; responseId: string }>;
}

export default async function ResponseDetailPage({ params }: PageProps) {
  const { formId, responseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get form with questions
  const { data: form } = await supabase
    .from('forms')
    .select(`
      *,
      questions (*)
    `)
    .eq('id', formId)
    .single();

  if (!form || form.user_id !== user.id) {
    redirect('/dashboard');
  }

  // Sort questions by order
  const sortedQuestions = (form.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
  );

  const formWithQuestions = {
    ...form,
    questions: sortedQuestions,
  };

  // Get response with answers
  const responseResult = await getResponseById(responseId);

  if (responseResult.error || !responseResult.data) {
    redirect(`/forms/${formId}/responses`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <ResponseDetail
        form={formWithQuestions}
        response={responseResult.data}
      />
    </div>
  );
}
