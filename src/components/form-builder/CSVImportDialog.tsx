'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { nanoid } from 'nanoid';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (options: Array<{ id: string; label: string }>) => void;
  currentOptionsCount?: number;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
  currentOptionsCount = 0,
}: CSVImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [previewOptions, setPreviewOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [parseMode, setParseMode] = useState<'append' | 'replace'>('append');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParseCsv = () => {
    setError(null);

    if (!csvText.trim()) {
      setError('Please enter CSV data');
      return;
    }

    try {
      // Parse CSV - supports comma, semicolon, or newline separated
      const lines = csvText
        .split(/[\n,;]/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        setError('No valid options found in CSV');
        return;
      }

      if (lines.length > 100) {
        setError('Too many options. Maximum 100 allowed.');
        return;
      }

      // Create options array
      const options = lines.map(label => ({
        id: nanoid(),
        label: label,
      }));

      setPreviewOptions(options);
    } catch (err) {
      setError('Failed to parse CSV data');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (previewOptions.length === 0) {
      setError('No options to import. Click "Parse CSV" first.');
      return;
    }

    onImport(previewOptions);

    // Reset state
    setCsvText('');
    setPreviewOptions([]);
    setError(null);
    onOpenChange(false);
  };

  const handleReset = () => {
    setCsvText('');
    setPreviewOptions([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Options from CSV</DialogTitle>
          <DialogDescription>
            Import multiple choice options from CSV, comma-separated, or line-separated text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enter one option per line, or separate options with commas or semicolons.
              Example: &quot;Option 1, Option 2, Option 3&quot; or one per line.
            </AlertDescription>
          </Alert>

          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={parseMode === 'append' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setParseMode('append')}
            >
              Append to Existing ({currentOptionsCount})
            </Button>
            <Button
              variant={parseMode === 'replace' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setParseMode('replace')}
            >
              Replace All Options
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload CSV File (Optional)</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>

          {/* CSV Text Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-text">Or Enter Options Manually</Label>
            <Textarea
              id="csv-text"
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setError(null);
                setPreviewOptions([]);
              }}
              placeholder="Option 1&#10;Option 2&#10;Option 3&#10;&#10;or&#10;&#10;Option 1, Option 2, Option 3"
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleParseCsv}
                disabled={!csvText.trim()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Parse CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({previewOptions.length} options)</Label>
                <Badge variant="secondary">
                  {parseMode === 'append'
                    ? `Will add to ${currentOptionsCount} existing`
                    : 'Will replace all'}
                </Badge>
              </div>
              <div className="p-3 border rounded-lg bg-slate-50 max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {previewOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-2 p-2 bg-white rounded text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="font-mono text-xs text-slate-500 flex-shrink-0">
                        {index + 1}.
                      </span>
                      <span className="flex-1 truncate">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewOptions.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import {previewOptions.length} Options
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
