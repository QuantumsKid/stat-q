import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ResponsesOverview } from '@/components/analytics/ResponsesOverview';
import { getFormResponses, getResponseStats } from './actions';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function ResponsesPage({ params }: PageProps) {
  const { formId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get form details
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

  // Get responses
  const responsesResult = await getFormResponses(formId);
  const statsResult = await getResponseStats(formId);

  if (responsesResult.error || statsResult.error || !statsResult.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Failed to load responses</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <ResponsesOverview
        form={formWithQuestions}
        responses={responsesResult.data || []}
        stats={statsResult.data}
      />
    </div>
  );
}
