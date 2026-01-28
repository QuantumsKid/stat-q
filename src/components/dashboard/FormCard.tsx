'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  FileText,
  Archive,
  ArchiveRestore,
  Share2,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteForm, duplicateForm, archiveForm, unarchiveForm } from '@/app/(dashboard)/actions';
import { toast } from 'sonner';
import type { FormWithStats } from '@/lib/types/form.types';
import { ShareDialog } from '@/components/share/ShareDialog';

interface FormCardProps {
  form: FormWithStats;
  showArchived?: boolean;
}

export function FormCard({ form, showArchived = false }: FormCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteForm(form.id);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Form deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete form');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateForm(form.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Form duplicated successfully');
      }
    } catch (error) {
      toast.error('Failed to duplicate form');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = form.is_archived
        ? await unarchiveForm(form.id)
        : await archiveForm(form.id);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(form.is_archived ? 'Form restored' : 'Form archived');
      }
    } catch (error) {
      toast.error(form.is_archived ? 'Failed to restore form' : 'Failed to archive form');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Card className="group backdrop-blur-sm bg-white/90 border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex-1 space-y-1">
            <div className="block">
              <h3 className="font-semibold text-lg leading-none tracking-tight text-slate-900 transition-colors line-clamp-2">
                {form.title}
              </h3>
            </div>
            {form.description && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {form.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Form actions menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/submit`} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Form
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/edit`} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Form
                </Link>
              </DropdownMenuItem>
              {form.responseCount > 0 && (
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/responses`} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Responses
                  </Link>
                </DropdownMenuItem>
              )}
              {form.responseCount > 0 && (
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/analytics`} className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
              )}
              {form.is_published && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <Copy className="mr-2 h-4 w-4" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </DropdownMenuItem>
              {!showArchived && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </DropdownMenuItem>
              )}
              {showArchived && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {isArchiving ? 'Restoring...' : 'Restore'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{form.questionCount} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{form.responseCount} responses</span>
              </div>
            </div>
            <Badge variant={form.is_published ? 'default' : 'secondary'}>
              {form.is_published ? 'Published' : 'Draft'}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link href={`/forms/${form.id}/submit`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Form
              </Button>
            </Link>
            <Link href={`/forms/${form.id}/edit`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            {form.responseCount > 0 && (
              <Link href={`/forms/${form.id}/responses`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Updated {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{form.title}&quot; and all its questions
              and responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        formId={form.id}
        formTitle={form.title}
      />
    </>
  );
}
