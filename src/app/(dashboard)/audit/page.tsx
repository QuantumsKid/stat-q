import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { getAuditLogs, getAuditLogStats } from './actions';
import { ArrowLeft, Activity, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AuditLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only admins can access audit logs
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch audit logs and stats
  const logsResult = await getAuditLogs({ limit: 100 });
  const statsResult = await getAuditLogStats();

  if (logsResult.error || !logsResult.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Failed to load audit logs</p>
      </div>
    );
  }

  const stats = statsResult.data || { totalLogs: 0, actionCounts: {}, recentCount: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex items-center justify-between mb-6" aria-label="Audit log navigation">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-slate-600">
                System activity and user actions
              </p>
            </div>
          </div>
        </nav>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Last 24 Hours</p>
                <p className="text-2xl font-bold">{stats.recentCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Action Types</p>
                <p className="text-2xl font-bold">
                  {Object.keys(stats.actionCounts).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Viewer */}
        <AuditLogViewer logs={logsResult.data} />
      </main>
    </div>
  );
}
