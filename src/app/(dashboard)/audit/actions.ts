'use server';

import { createClient } from '@/utils/supabase/server';
import type { AuditLog, AuditLogFilters } from '@/lib/types/audit.types';

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', data: null };
  }

  // Get user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only admins can view audit logs
  if (profile?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', data: null };
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { error: 'Failed to fetch audit logs', data: null };
    }

    return { data: data as AuditLog[], error: null };
  } catch (error) {
    console.error('Unexpected error fetching audit logs:', error);
    return { error: 'An unexpected error occurred', data: null };
  }
}

export async function getAuditLogStats() {
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
    // Get total count
    const { count: totalLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Get count by action type
    const { data: actionStats } = await supabase
      .from('audit_logs')
      .select('action')
      .limit(1000);

    // Group by action
    const actionCounts: Record<string, number> = {};
    if (actionStats) {
      actionStats.forEach((log) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: recentCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    return {
      data: {
        totalLogs: totalLogs || 0,
        actionCounts,
        recentCount: recentCount || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    return { error: 'Failed to fetch audit log stats', data: null };
  }
}

/**
 * Export audit logs in specified format
 */
export async function exportAuditLogs(
  filters: AuditLogFilters = {},
  format: 'csv' | 'json' = 'csv'
): Promise<{ data: string | null; error: string | null; filename: string | null }> {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', data: null, filename: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', data: null, filename: null };
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // For export, get all matching records (up to 10,000)
    const { data: logs, error } = await query.limit(10000);

    if (error) {
      console.error('Error fetching audit logs for export:', error);
      return { error: 'Failed to fetch audit logs', data: null, filename: null };
    }

    if (!logs || logs.length === 0) {
      return { error: 'No audit logs found to export', data: null, filename: null };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let exportData: string;
    let filename: string;

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Timestamp',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'User Agent',
        'Details',
      ];

      const csvRows = [
        headers.join(','),
        ...logs.map((log) => {
          const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
          return [
            log.created_at,
            log.user_email || '',
            log.action,
            log.resource_type,
            log.resource_id || '',
            log.ip_address || '',
            `"${log.user_agent?.replace(/"/g, '""') || ''}"`,
            `"${details}"`,
          ].join(',');
        }),
      ];

      exportData = csvRows.join('\n');
      filename = `audit-logs-${timestamp}.csv`;
    } else {
      // Generate JSON
      exportData = JSON.stringify(logs, null, 2);
      filename = `audit-logs-${timestamp}.json`;
    }

    return {
      data: exportData,
      error: null,
      filename,
    };
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return { error: 'Failed to export audit logs', data: null, filename: null };
  }
}
