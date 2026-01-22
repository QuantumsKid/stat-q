import { Suspense } from 'react';
import { getForms } from '../../actions';
import { FormCard } from '@/components/dashboard/FormCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Archive } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function FormsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

async function ArchivedFormsContent() {
  const allForms = await getForms(true);
  const archivedForms = allForms.filter((form) => form.is_archived);

  if (archivedForms.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600 text-lg">
          No archived forms
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Forms you archive will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {archivedForms.map((form) => (
        <FormCard key={form.id} form={form} showArchived={true} />
      ))}
    </div>
  );
}

export default function ArchivedFormsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            Archived Forms
          </h1>
          <p className="mt-2 text-slate-600">
            View and restore your archived forms
          </p>
        </div>
      </div>

      <Suspense fallback={<FormsListSkeleton />}>
        <ArchivedFormsContent />
      </Suspense>
    </div>
  );
}
