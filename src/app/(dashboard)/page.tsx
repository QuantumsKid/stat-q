import { Suspense } from 'react';
import { getForms } from './actions';
import { FormsList } from '@/components/dashboard/FormsList';
import { CreateFormDialog } from '@/components/dashboard/CreateFormDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import Link from 'next/link';

function FormsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

async function FormsContent() {
  const forms = await getForms();

  return <FormsList forms={forms} />;
}

export default function DashboardPage() {
  console.log('[DashboardPage] Rendering DashboardPage');
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            My Forms
          </h1>
          <p className="mt-2 text-slate-600">
            Create and manage your forms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/archived">
            <Button variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Button>
          </Link>
          <CreateFormDialog />
        </div>
      </div>

      <Suspense fallback={<FormsListSkeleton />}>
        <FormsContent />
      </Suspense>
    </div>
  );
}
