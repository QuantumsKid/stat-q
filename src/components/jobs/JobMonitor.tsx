'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllQueueStats, cleanupOldJobs } from '@/app/(dashboard)/jobs/actions';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface AllQueueStats {
  email: QueueStats;
  analytics: QueueStats;
  export: QueueStats;
  notifications: QueueStats;
}

export function JobMonitor() {
  const [stats, setStats] = useState<AllQueueStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const result = await getAllQueueStats();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setStats(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      toast.error('Failed to fetch queue statistics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await cleanupOldJobs();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Old jobs cleaned up successfully');
        await fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error cleaning up jobs:', error);
      toast.error('Failed to clean up jobs');
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (queue: QueueStats) => {
    if (queue.failed > 0) return 'text-red-600';
    if (queue.active > 0) return 'text-blue-600';
    if (queue.waiting > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const renderQueueCard = (name: string, queueStats: QueueStats, icon: string) => (
    <Card key={name}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              {name} Queue
            </CardTitle>
            <CardDescription>Background job processing</CardDescription>
          </div>
          <div className={`text-3xl font-bold ${getStatusColor(queueStats)}`}>
            {queueStats.active}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Waiting</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-lg font-semibold">{queueStats.waiting}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Active</p>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-lg font-semibold">{queueStats.active}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Completed</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold">{queueStats.completed}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Failed</p>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-lg font-semibold">{queueStats.failed}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Delayed</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-lg font-semibold">{queueStats.delayed}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Total</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{queueStats.total}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Success Rate: {queueStats.total > 0 ? ((queueStats.completed / queueStats.total) * 100).toFixed(1) : 0}%
            </span>
            {queueStats.failed > 0 && (
              <Badge variant="destructive" className="text-xs">
                {queueStats.failed} failed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Queue Monitor</h2>
          <p className="text-sm text-slate-600 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanup}
            disabled={isCleaning}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isCleaning ? 'Cleaning...' : 'Clean Old Jobs'}
          </Button>
        </div>
      </div>

      {/* Queue Cards */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderQueueCard('Email', stats.email, '📧')}
          {renderQueueCard('Analytics', stats.analytics, '📊')}
          {renderQueueCard('Export', stats.export, '📥')}
          {renderQueueCard('Notifications', stats.notifications, '🔔')}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  );
}