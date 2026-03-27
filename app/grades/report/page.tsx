'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { SubjectGrade } from '@/types';
import Skeleton from '@/components/ui/Skeleton';

function isPassedSubject(sub: SubjectGrade) {
  const gradeNum = parseFloat(sub.grade);
  return sub.remarks.toLowerCase().includes('pass') || (gradeNum <= 3.0 && gradeNum > 0);
}

export default function GradeReportPage() {
  const searchParams = useSearchParams();
  const href = searchParams.get('href');
  const title = searchParams.get('title');

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grade-report', href, title],
    queryFn: async () => {
      if (!href) return null;

      const response = await fetch('/api/student/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          href,
          reportName: title || undefined,
        }),
      });

      const result = await response.json();
      return result.success ? (result.subjects as SubjectGrade[]) : null;
    },
    enabled: !!href,
  });

  const semesterTitle = (title || 'Grades').replace('Grades of ', '');

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/grades"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{semesterTitle}</h1>
              <p className="text-xs text-muted-foreground">Grade Record</p>
            </div>
          </div>
        </div>

        {!href ? (
          <div className="text-center py-16 bg-accent rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Missing report link. Open a semester from the Grades page.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border border-border rounded-xl flex justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : grades ? (
          <div className="space-y-6">
            <div className="bg-secondary p-4 rounded-xl border border-border/50">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Semester Summary</span>
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded shadow-sm">{grades.length} Subjects</span>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-accent/20">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Subject Description</th>
                      <th className="px-4 py-3 text-center">Section</th>
                      <th className="px-4 py-3 text-center">Grade</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {grades.map((sub, sIdx) => {
                      const isPassed = isPassedSubject(sub);
                      return (
                        <tr key={sIdx} className="hover:bg-accent/50 transition-colors group">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground bg-accent group-hover:bg-background px-2 py-1 rounded transition-colors uppercase">
                              {sub.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[11px] font-bold text-foreground uppercase leading-tight break-words">
                              {sub.description}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-bold text-muted-foreground bg-accent/50 px-2 py-0.5 rounded uppercase">
                              {sub.section || '---'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={
                                'text-xs font-black px-2 py-1 rounded-lg border ' +
                                (isPassed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50')
                              }
                            >
                              {sub.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPassed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                              )}
                              <span
                                className={
                                  'text-[9px] font-black uppercase tracking-widest ' +
                                  (isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')
                                }
                              >
                                {sub.remarks}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-accent rounded-xl border border-dashed border-border">
            <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No records available</p>
          </div>
        )}
      </main>
    </div>
  );
}
