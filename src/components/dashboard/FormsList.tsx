import { FileText } from 'lucide-react';
import { FormCard } from './FormCard';
import type { FormWithStats } from '@/lib/types/form.types';

interface FormsListProps {
  forms: FormWithStats[];
}

export function FormsList({ forms }: FormsListProps) {
  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="rounded-full bg-slate-100 p-6 mb-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">
          No forms yet
        </h3>
        <p className="text-slate-600 text-center max-w-sm">
          Get started by creating your first form. Click the &quot;Create Form&quot; button
          above to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <FormCard key={form.id} form={form} />
      ))}
    </div>
  );
}
