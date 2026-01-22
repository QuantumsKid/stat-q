import { Metadata } from 'next';
import { JobMonitor } from '@/components/jobs/JobMonitor';

export const metadata: Metadata = {
  title: 'Job Queue Monitor | StatQ',
  description: 'Monitor background job processing',
};

export default function JobsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <JobMonitor />
    </div>
  );
}
