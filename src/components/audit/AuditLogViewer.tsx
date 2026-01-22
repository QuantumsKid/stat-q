'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, FileText, Trash2, Edit, Eye, CheckCircle, Download } from 'lucide-react';
import type { AuditLog } from '@/lib/types/audit.types';
import type { AuditLogFilters } from '@/lib/types/audit.types';
import { exportAuditLogs } from '@/app/(dashboard)/audit/actions';
import { toast } from 'sonner';

interface AuditLogViewerProps {
  logs: AuditLog[];
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <FileText className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  publish: <CheckCircle className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  view: 'outline',
  publish: 'default',
};

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Get unique actions and resource types for filters
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueResourceTypes = Array.from(new Set(logs.map((log) => log.resource_type)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        log.user_email?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.resource_type.toLowerCase().includes(query) ||
        log.resource_id?.toLowerCase().includes(query);

      if (!matches) return false;
    }

    // Action filter
    if (filterAction !== 'all' && log.action !== filterAction) {
      return false;
    }

    // Resource type filter
    if (filterResourceType !== 'all' && log.resource_type !== filterResourceType) {
      return false;
    }

    return true;
  });

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatResourceType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      // Build filters from current state
      const filters: AuditLogFilters = {};
      if (filterAction !== 'all') {
        filters.action = filterAction;
      }
      if (filterResourceType !== 'all') {
        filters.resource_type = filterResourceType;
      }

      const result = await exportAuditLogs(filters, format);

      if (result.error || !result.data || !result.filename) {
        toast.error(result.error || 'Failed to export audit logs');
        return;
      }

      // Create download link
      const blob = new Blob([result.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredLogs.length} audit logs as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('An unexpected error occurred while exporting');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    User
                  </p>
                  <p className="text-sm">{selectedLog.user_email || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Action
                  </p>
                  <Badge variant={ACTION_COLORS[selectedLog.action] || 'outline'}>
                    {formatActionName(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Resource Type
                  </p>
                  <p className="text-sm">{formatResourceType(selectedLog.resource_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Resource ID
                  </p>
                  <p className="text-sm font-mono text-xs">
                    {selectedLog.resource_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Timestamp
                  </p>
                  <p className="text-sm">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    IP Address
                  </p>
                  <p className="text-sm">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Details
                  </p>
                  <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    User Agent
                  </p>
                  <p className="text-xs text-slate-600 break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Filters and Export */}
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatActionName(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterResourceType} onValueChange={setFilterResourceType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatResourceType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-slate-600">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting || filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={isExporting || filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                {isExporting ? 'Exporting...' : 'Export JSON'}
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">
                {logs.length === 0 ? 'No audit logs found' : 'No logs match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {log.user_email || (
                          <span className="text-slate-400">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ACTION_COLORS[log.action] || 'outline'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {ACTION_ICONS[log.action]}
                          {formatActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatResourceType(log.resource_type)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600">
                          {log.resource_id?.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
