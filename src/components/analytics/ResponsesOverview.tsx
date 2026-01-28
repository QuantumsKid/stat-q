'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, MoreVertical, Trash2, Eye, BarChart3, Search, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { deleteResponse } from '@/app/(dashboard)/forms/[formId]/responses/actions';
import { StatsCards } from './StatsCards';
import { exportResponsesToCSV } from '@/lib/utils/csv-export';
import { exportResponsesToExcel } from '@/lib/utils/excel-export';
import type { FormWithQuestions } from '@/lib/types/form.types';

interface ResponseData {
  id: string;
  form_id: string;
  respondent_email: string | null;
  is_complete: boolean;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  answers: Array<{
    question_id: string;
    value: unknown;
  }>;
}

interface ResponsesOverviewProps {
  form: FormWithQuestions;
  responses: ResponseData[];
  stats: {
    totalResponses: number;
    completedResponses: number;
    incompleteResponses: number;
    responses: Array<{ started_at: string; submitted_at?: string }>;
  };
}

export function ResponsesOverview({ form, responses, stats }: ResponsesOverviewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');

  const handleDelete = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return;
    }

    const result = await deleteResponse(responseId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Response deleted');
      router.refresh();
    }
  };

  const handleExportCSV = () => {
    // Only export complete responses
    const completeResponses = responses.filter((r) => r.is_complete);

    if (completeResponses.length === 0) {
      toast.error('No complete responses to export');
      return;
    }

    exportResponsesToCSV(form.title, form.questions, completeResponses);
    toast.success(`Exported ${completeResponses.length} responses to CSV`);
  };

  const handleExportExcel = async () => {
    // Only export complete responses
    const completeResponses = responses.filter((r) => r.is_complete);

    if (completeResponses.length === 0) {
      toast.error('No complete responses to export');
      return;
    }

    try {
      await exportResponsesToExcel(form.title, form.questions, completeResponses);
      toast.success(`Exported ${completeResponses.length} responses to Excel`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export to Excel');
    }
  };

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    // Filter by status
    if (filterStatus === 'complete' && !response.is_complete) return false;
    if (filterStatus === 'incomplete' && response.is_complete) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const email = response.respondent_email?.toLowerCase() || '';
      const id = response.id.toLowerCase();
      return email.includes(query) || id.includes(query);
    }

    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <nav className="flex items-center justify-between mb-6" aria-label="Responses navigation">
        <div className="flex items-center gap-4">
          <Link href={`/forms/${form.id}/edit`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Form
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-slate-600">Responses</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/forms/${form.id}/analytics`)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </nav>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6 mt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email or response ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'complete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('complete')}
            >
              Complete
            </Button>
            <Button
              variant={filterStatus === 'incomplete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('incomplete')}
            >
              Incomplete
            </Button>
          </div>
        </div>

        {/* Responses Table */}
        {filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {responses.length === 0 ? 'No responses yet' : 'No responses match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Answers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      {response.is_complete ? (
                        <Badge>Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Incomplete</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {response.respondent_email || (
                        <span className="text-slate-400">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(response.started_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {response.submitted_at ? (
                        format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{response.answers.length}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Response actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/forms/${form.id}/responses/${response.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(response.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
