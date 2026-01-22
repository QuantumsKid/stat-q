'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Sparkles } from 'lucide-react';
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/constants/form-templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: FormTemplate) => void;
  onClose?: () => void;
}

const categoryLabels: Record<string, string> = {
  feedback: 'Feedback',
  survey: 'Survey',
  registration: 'Registration',
  quiz: 'Quiz',
  assessment: 'Assessment',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  feedback: 'bg-blue-100 text-blue-800',
  survey: 'bg-green-100 text-green-800',
  registration: 'bg-purple-100 text-purple-800',
  quiz: 'bg-orange-100 text-orange-800',
  assessment: 'bg-pink-100 text-pink-800',
  other: 'bg-slate-100 text-slate-800',
};

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

  const categories = Array.from(new Set(FORM_TEMPLATES.map(t => t.category)));

  const filteredTemplates = FORM_TEMPLATES.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: FormTemplate) => {
    onSelectTemplate(template);
    onClose?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Form Templates</h2>
        <p className="text-slate-600">
          Start with a professional template and customize it to your needs
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Templates
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]}
            </Button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No templates found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{template.icon}</div>
                  <Badge className={categoryColors[template.category]}>
                    {categoryLabels[template.category]}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-1">{template.questions.length} questions:</p>
                  <ul className="space-y-1 text-xs">
                    {template.questions.slice(0, 3).map((q, idx) => (
                      <li key={idx} className="truncate">
                        • {q.title}
                      </li>
                    ))}
                    {template.questions.length > 3 && (
                      <li className="text-slate-400 italic">
                        +{template.questions.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPreviewTemplate(template)}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{previewTemplate?.icon}</span>
              <div>
                <DialogTitle>{previewTemplate?.name}</DialogTitle>
                <DialogDescription>{previewTemplate?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Questions ({previewTemplate?.questions.length})</h4>
              <div className="space-y-3">
                {previewTemplate?.questions.map((question, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-slate-50"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {question.title}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {question.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {question.description}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {question.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => previewTemplate && handleUseTemplate(previewTemplate)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
