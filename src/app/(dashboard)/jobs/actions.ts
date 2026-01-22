'use server';

import { createClient } from '@/utils/supabase/server';
import { getQueueStats, QUEUE_NAMES, cleanQueues } from '@/lib/jobs/queue';

/**
 * Get statistics for all job queues
 */
export async function getAllQueueStats() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', data: null };
  }

  try {
    const [emailStats, analyticsStats, exportStats, notificationsStats] = await Promise.all([
      getQueueStats(QUEUE_NAMES.EMAIL),
      getQueueStats(QUEUE_NAMES.ANALYTICS),
      getQueueStats(QUEUE_NAMES.EXPORT),
      getQueueStats(QUEUE_NAMES.NOTIFICATIONS),
    ]);

    return {
      data: {
        email: emailStats,
        analytics: analyticsStats,
        export: exportStats,
        notifications: notificationsStats,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return { error: 'Failed to fetch queue statistics', data: null };
  }
}

/**
 * Clean up old jobs from all queues
 */
export async function cleanupOldJobs() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', success: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', success: false };
  }

  try {
    await cleanQueues();
    return { success: true, error: null };
  } catch (error) {
    console.error('Error cleaning queues:', error);
    return { error: 'Failed to clean queues', success: false };
  }
}
