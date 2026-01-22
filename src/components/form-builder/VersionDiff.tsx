'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Minus, Edit } from 'lucide-react';
import type { FormVersion } from '@/app/(dashboard)/forms/[formId]/versions/actions';

interface VersionDiffProps {
  oldVersion: FormVersion;
  newVersion: FormVersion;
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface QuestionDiff {
  id: string;
  type: DiffType;
  title: string;
  oldTitle?: string;
  questionType: string;
  oldQuestionType?: string;
  changes: string[];
}

function calculateQuestionDiffs(
  oldQuestions: any[],
  newQuestions: any[]
): QuestionDiff[] {
  const diffs: QuestionDiff[] = [];
  const oldMap = new Map(oldQuestions.map(q => [q.id, q]));
  const newMap = new Map(newQuestions.map(q => [q.id, q]));

  // Check for removed and modified questions
  oldQuestions.forEach(oldQ => {
    const newQ = newMap.get(oldQ.id);

    if (!newQ) {
      // Question was removed
      diffs.push({
        id: oldQ.id,
        type: 'removed',
        title: oldQ.title,
        questionType: oldQ.type,
        changes: [],
      });
    } else {
      // Check for modifications
      const changes: string[] = [];

      if (oldQ.title !== newQ.title) {
        changes.push(`Title changed from "${oldQ.title}" to "${newQ.title}"`);
      }

      if (oldQ.type !== newQ.type) {
        changes.push(`Type changed from ${oldQ.type} to ${newQ.type}`);
      }

      if (oldQ.required !== newQ.required) {
        changes.push(newQ.required ? 'Made required' : 'Made optional');
      }

      if (oldQ.description !== newQ.description) {
        changes.push('Description changed');
      }

      if (JSON.stringify(oldQ.options) !== JSON.stringify(newQ.options)) {
        changes.push('Options modified');
      }

      if (JSON.stringify(oldQ.logic_rules) !== JSON.stringify(newQ.logic_rules)) {
        changes.push('Logic rules changed');
      }

      if (oldQ.order_index !== newQ.order_index) {
        changes.push(`Position changed from ${oldQ.order_index + 1} to ${newQ.order_index + 1}`);
      }

      if (changes.length > 0) {
        diffs.push({
          id: oldQ.id,
          type: 'modified',
          title: newQ.title,
          oldTitle: oldQ.title !== newQ.title ? oldQ.title : undefined,
          questionType: newQ.type,
          oldQuestionType: oldQ.type !== newQ.type ? oldQ.type : undefined,
          changes,
        });
      }
    }
  });

  // Check for added questions
  newQuestions.forEach(newQ => {
    if (!oldMap.has(newQ.id)) {
      diffs.push({
        id: newQ.id,
        type: 'added',
        title: newQ.title,
        questionType: newQ.type,
        changes: [],
      });
    }
  });

  return diffs;
}

function getDiffColor(type: DiffType): string {
  switch (type) {
    case 'added':
      return 'bg-green-50 border-green-200';
    case 'removed':
      return 'bg-red-50 border-red-200';
    case 'modified':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
}

function getDiffIcon(type: DiffType) {
  switch (type) {
    case 'added':
      return <Plus className="h-4 w-4 text-green-600" />;
    case 'removed':
      return <Minus className="h-4 w-4 text-red-600" />;
    case 'modified':
      return <Edit className="h-4 w-4 text-blue-600" />;
    default:
      return null;
  }
}

function getDiffBadge(type: DiffType) {
  switch (type) {
    case 'added':
      return <Badge className="bg-green-600 text-white text-xs">Added</Badge>;
    case 'removed':
      return <Badge className="bg-red-600 text-white text-xs">Removed</Badge>;
    case 'modified':
      return <Badge className="bg-blue-600 text-white text-xs">Modified</Badge>;
    default:
      return null;
  }
}

export function VersionDiff({ oldVersion, newVersion }: VersionDiffProps) {
  const oldQuestions = (oldVersion.questions as any[]) || [];
  const newQuestions = (newVersion.questions as any[]) || [];

  const questionDiffs = calculateQuestionDiffs(oldQuestions, newQuestions);

  const addedCount = questionDiffs.filter(d => d.type === 'added').length;
  const removedCount = questionDiffs.filter(d => d.type === 'removed').length;
  const modifiedCount = questionDiffs.filter(d => d.type === 'modified').length;

  // Settings differences
  const settingsChanges: string[] = [];
  const oldSettings = oldVersion.settings as any;
  const newSettings = newVersion.settings as any;

  if (oldVersion.title !== newVersion.title) {
    settingsChanges.push(`Title: "${oldVersion.title}" → "${newVersion.title}"`);
  }

  if (oldVersion.description !== newVersion.description) {
    settingsChanges.push('Description changed');
  }

  if (oldSettings?.display_mode !== newSettings?.display_mode) {
    settingsChanges.push(
      `Display mode: ${oldSettings?.display_mode} → ${newSettings?.display_mode}`
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Changes: Version {oldVersion.version_number} → Version {newVersion.version_number}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white">{addedCount}</Badge>
              <span className="text-slate-600">Added</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">{modifiedCount}</Badge>
              <span className="text-slate-600">Modified</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white">{removedCount}</Badge>
              <span className="text-slate-600">Removed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Settings Changes */}
      {settingsChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {settingsChanges.map((change, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Edit className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Question Changes */}
      <div>
        <h3 className="text-base font-semibold mb-3">Question Changes</h3>
        {questionDiffs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No question changes
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questionDiffs.map((diff, index) => (
              <Card key={diff.id} className={`border-2 ${getDiffColor(diff.type)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getDiffIcon(diff.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {diff.oldTitle && diff.type === 'modified' ? (
                              <>
                                <span className="line-through text-slate-400">{diff.oldTitle}</span>
                                {' → '}
                                <span>{diff.title}</span>
                              </>
                            ) : (
                              diff.title
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {diff.oldQuestionType ? (
                              <>
                                <span className="line-through">{diff.oldQuestionType}</span>
                                {' → '}
                                <span>{diff.questionType}</span>
                              </>
                            ) : (
                              diff.questionType
                            )}
                          </p>
                        </div>
                        {getDiffBadge(diff.type)}
                      </div>

                      {diff.changes.length > 0 && (
                        <ul className="text-xs text-slate-600 space-y-1 mt-2">
                          {diff.changes.map((change, idx) => (
                            <li key={idx}>• {change}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
