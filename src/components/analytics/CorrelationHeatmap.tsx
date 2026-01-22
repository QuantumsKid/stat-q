'use client';

import { useMemo } from 'react';
import type { CorrelationMatrix } from '@/lib/utils/correlation';
import { formatCorrelation, getCorrelationHeatmapColor } from '@/lib/utils/correlation';

interface CorrelationHeatmapProps {
  correlationMatrix: CorrelationMatrix;
}

export function CorrelationHeatmap({ correlationMatrix }: CorrelationHeatmapProps) {
  const { questions, matrix } = correlationMatrix;

  // Calculate cell size based on number of questions
  const cellSize = useMemo(() => {
    const numQuestions = questions.length;
    if (numQuestions <= 5) return 80;
    if (numQuestions <= 8) return 60;
    if (numQuestions <= 12) return 50;
    return 40;
  }, [questions.length]);

  // Truncate question titles for display
  const truncateTitle = (title: string, maxLength: number = 20): string => {
    if (title.length <= maxLength) return title;
    return `${title.substring(0, maxLength)}...`;
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No numeric questions available for correlation matrix</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-slate-300 bg-slate-100 sticky left-0 z-10">
                <div className="w-12 h-12" />
              </th>
              {questions.map((question, index) => (
                <th
                  key={question.id}
                  className="p-2 border border-slate-300 bg-slate-100"
                  style={{ minWidth: cellSize, maxWidth: cellSize }}
                >
                  <div
                    className="transform -rotate-45 origin-left text-xs font-medium truncate"
                    style={{ width: cellSize * 1.5 }}
                    title={question.title}
                  >
                    Q{index + 1}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((rowQuestion, rowIndex) => (
              <tr key={rowQuestion.id}>
                <th
                  className="p-2 border border-slate-300 bg-slate-100 text-left sticky left-0 z-10"
                  style={{ minWidth: 60 }}
                >
                  <div
                    className="text-xs font-medium truncate"
                    title={rowQuestion.title}
                  >
                    Q{rowIndex + 1}
                  </div>
                </th>
                {questions.map((colQuestion, colIndex) => {
                  const coefficient = matrix[rowIndex][colIndex];
                  const backgroundColor = getCorrelationHeatmapColor(coefficient);
                  const textColor =
                    Math.abs(coefficient) > 0.5 ? 'white' : 'black';

                  return (
                    <td
                      key={colQuestion.id}
                      className="p-1 border border-slate-300 text-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor,
                        color: textColor,
                        minWidth: cellSize,
                        maxWidth: cellSize,
                        height: cellSize,
                      }}
                      title={`${rowQuestion.title} × ${colQuestion.title}: ${formatCorrelation(coefficient)}`}
                    >
                      <div className="text-xs font-semibold">
                        {rowIndex === colIndex ? '1.00' : formatCorrelation(coefficient)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-sm mb-2">Color Legend</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-slate-300"
              style={{ backgroundColor: getCorrelationHeatmapColor(1.0) }}
            />
            <span className="text-xs">Strong Positive (0.8 to 1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-slate-300"
              style={{ backgroundColor: getCorrelationHeatmapColor(0.5) }}
            />
            <span className="text-xs">Moderate Positive (0.4 to 0.8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-slate-300"
              style={{ backgroundColor: getCorrelationHeatmapColor(0.1) }}
            />
            <span className="text-xs">Weak/None (-0.2 to 0.2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-slate-300"
              style={{ backgroundColor: getCorrelationHeatmapColor(-0.5) }}
            />
            <span className="text-xs">Moderate Negative (-0.8 to -0.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-slate-300"
              style={{ backgroundColor: getCorrelationHeatmapColor(-1.0) }}
            />
            <span className="text-xs">Strong Negative (-1.0 to -0.8)</span>
          </div>
        </div>
      </div>

      {/* Question List */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-sm mb-2">Question Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {questions.map((question, index) => (
            <div key={question.id} className="text-xs">
              <span className="font-semibold">Q{index + 1}:</span>{' '}
              {question.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
