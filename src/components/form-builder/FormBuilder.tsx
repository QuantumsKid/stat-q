'use client';

import { useState, useEffect } from 'react';
import { FormHeader } from './FormHeader';
import { QuestionList } from './QuestionList';
import { QuestionEditor } from './QuestionEditor';
import {
  updateForm,
  addQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  checkFormHasResponses,
} from '@/app/(dashboard)/forms/[formId]/edit/actions';
import { useAutosave } from '@/hooks/use-autosave';
import { toast } from 'sonner';
import { useScreenReaderAnnouncement } from '@/components/accessibility/ScreenReaderAnnouncer';
import type { FormWithQuestions } from '@/lib/types/form.types';
import type { Question, QuestionType } from '@/lib/types/question.types';
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

interface FormBuilderProps {
  form: FormWithQuestions;
}

export function FormBuilder({ form: initialForm }: FormBuilderProps) {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description || '');
  const [isPublished, setIsPublished] = useState(initialForm.is_published);
  const [displayMode, setDisplayMode] = useState<'single' | 'scroll'>(
    initialForm.display_mode || 'scroll'
  );
  const [questions, setQuestions] = useState<Question[]>(initialForm.questions || []);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  );
  const [responseCount, setResponseCount] = useState<number>(0);
  const [hasResponses, setHasResponses] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Screen reader announcements
  const { announcePolite } = useScreenReaderAnnouncement();

  // Check if form has responses
  useEffect(() => {
    const checkResponses = async () => {
      const result = await checkFormHasResponses(initialForm.id);
      setHasResponses(result.hasResponses);
      setResponseCount(result.count);
    };

    checkResponses();
  }, [initialForm.id]);

  // Auto-save form metadata
  const { isSaving, lastSaved } = useAutosave(
    { title, description, is_published: isPublished, display_mode: displayMode },
    async (data) => {
      await updateForm(initialForm.id, data);
    }
  );

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  const handleAddQuestion = async (type: QuestionType) => {
    const result = await addQuestion(initialForm.id, {
      type,
      title: 'Untitled Question',
      required: false,
      order_index: questions.length,
    });

    if (result.error) {
      toast.error(result.error);
      announcePolite(`Error adding question: ${result.error}`);
    } else if (result.data) {
      setQuestions([...questions, result.data]);
      setSelectedQuestionId(result.data.id);
      toast.success('Question added');
      announcePolite(`Question added. Total questions: ${questions.length + 1}. New question selected.`);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    // Show confirmation if form has responses
    if (hasResponses) {
      setPendingDeleteId(questionId);
      return;
    }

    await performDelete(questionId);
  };

  const performDelete = async (questionId: string) => {
    const result = await deleteQuestion(questionId);

    if (result.error) {
      toast.error(result.error);
      announcePolite(`Error deleting question: ${result.error}`);
    } else {
      const deletedQuestion = questions.find((q) => q.id === questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(questions.length > 1 ? questions[0].id : null);
      }
      toast.success('Question deleted');
      announcePolite(`Question deleted. ${deletedQuestion?.title || 'Question'} removed. Total questions: ${questions.length - 1}.`);
    }
    setPendingDeleteId(null);
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    const result = await duplicateQuestion(questionId);

    if (result.error) {
      toast.error(result.error);
      announcePolite(`Error duplicating question: ${result.error}`);
    } else if (result.data) {
      setQuestions([...questions, result.data]);
      setSelectedQuestionId(result.data.id);
      toast.success('Question duplicated');
      announcePolite(`Question duplicated. Total questions: ${questions.length + 1}. Duplicate selected.`);
    }
  };

  const handleReorderQuestions = async (reorderedQuestions: Question[]) => {
    // Optimistic update
    setQuestions(reorderedQuestions);

    const questionIds = reorderedQuestions.map((q) => q.id);
    const result = await reorderQuestions(initialForm.id, questionIds);

    if (result.error) {
      toast.error(result.error);
      announcePolite(`Error reordering questions: ${result.error}`);
      // Revert on error
      setQuestions(questions);
    } else {
      announcePolite(`Questions reordered. New order saved.`);
    }
  };

  const handleUpdateQuestion = (updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) =>
        q.id === selectedQuestionId ? { ...q, ...updates } : q
      )
    );
  };

  return (
    <>
      <AlertDialog open={!!pendingDeleteId} onOpenChange={() => setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question with Existing Responses?</AlertDialogTitle>
            <AlertDialogDescription>
              This form has {responseCount} response{responseCount !== 1 ? 's' : ''}. Deleting this question will permanently remove all associated response data.
              <br />
              <br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDeleteId && performDelete(pendingDeleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <FormHeader
          formId={initialForm.id}
          title={title}
          description={description}
          isPublished={isPublished}
          displayMode={displayMode}
          isSaving={isSaving}
          lastSaved={lastSaved}
          questions={questions}
          hasResponses={hasResponses}
          responseCount={responseCount}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onPublishedChange={setIsPublished}
          onDisplayModeChange={setDisplayMode}
        />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List - Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <QuestionList
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onReorderQuestions={handleReorderQuestions}
              onAddQuestion={handleAddQuestion}
              onDuplicateQuestion={handleDuplicateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
          </div>

          {/* Question Editor - Right Column (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-6 sticky top-24">
              {selectedQuestion ? (
                <>
                  <h3 className="text-lg font-semibold mb-6">Edit Question</h3>
                  <QuestionEditor
                    question={selectedQuestion}
                    allQuestions={questions}
                    onUpdate={handleUpdateQuestion}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">
                    Select a question to edit
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
