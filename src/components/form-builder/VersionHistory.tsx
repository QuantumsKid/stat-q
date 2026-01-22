'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  Clock,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { FormVersion } from '@/app/(dashboard)/forms/[formId]/versions/actions';
import { restoreFromVersion, deleteFormVersion } from '@/app/(dashboard)/forms/[formId]/versions/actions';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  formId: string;
  versions: FormVersion[];
  onVersionRestore?: () => void;
  onViewDiff?: (version: FormVersion) => void;
}

export function VersionHistory({
  formId,
  versions,
  onVersionRestore,
  onViewDiff,
}: VersionHistoryProps) {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      const result = await restoreFromVersion(formId, selectedVersion.id);

      if (result.success) {
        toast.success('Version restored successfully');
        setRestoreDialogOpen(false);
        onVersionRestore?.();
      } else {
        toast.error(result.error || 'Failed to restore version');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVersion) return;

    setIsDeleting(true);
    try {
      const result = await deleteFormVersion(selectedVersion.id, formId);

      if (result.success) {
        toast.success('Version deleted');
        setDeleteDialogOpen(false);
        onVersionRestore?.(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete version');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              No version history yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Versions are automatically created when you publish your form
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {versions.map((version, index) => {
          const isLatest = index === 0;
          const questionCount = Array.isArray(version.questions)
            ? version.questions.length
            : 0;

          return (
            <Card key={version.id} className={isLatest ? 'border-blue-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        Version {version.version_number}
                      </CardTitle>
                      {isLatest && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Latest
                        </Badge>
                      )}
                      {version.is_published && (
                        <Badge variant="secondary" className="text-xs">
                          Published
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm">{version.title}</p>
                  {version.change_summary && (
                    <p className="text-xs text-slate-500 mt-1">
                      {version.change_summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>{questionCount} questions</span>
                  {version.description && <span className="truncate max-w-xs">{version.description}</span>}
                </div>

                <div className="flex gap-2 pt-2">
                  {onViewDiff && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDiff(version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}

                  {!isLatest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version);
                        setRestoreDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}

                  {!version.is_published && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedVersion(version);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {selectedVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will replace the current form with the selected version. The current state will be lost unless you create a version snapshot first.
              </p>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Warning</p>
                  <p className="text-xs mt-1">
                    All current questions, settings, and logic will be replaced with the version from{' '}
                    <strong>
                      {selectedVersion && formatDistanceToNow(new Date(selectedVersion.created_at), { addSuffix: true })}
                    </strong>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRestoring ? 'Restoring...' : 'Restore Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version {selectedVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This version snapshot will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
