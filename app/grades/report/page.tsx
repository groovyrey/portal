'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronLeft, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { SubjectGrade } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground">
            <Link href="/grades">
              <ArrowLeft className="h-4 w-4" />
              Back to Grades
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{semesterTitle}</h2>
            <p className="text-sm text-muted-foreground">Detailed grade report for this semester.</p>
          </div>
          {grades && (
            <Badge variant="secondary" className="h-7 px-3">
              {grades.length} Subjects
            </Badge>
          )}
        </div>

        <Separator />

        {!href ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="p-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">Missing report link. Please return to the grades overview.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
          </div>
        ) : grades ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 text-left">Code</th>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-center">Section</th>
                    <th className="px-6 py-3 text-center">Grade</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grades.map((sub, idx) => {
                    const isPassed = isPassedSubject(sub);
                    return (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground uppercase">{sub.code}</td>
                        <td className="px-6 py-4 font-medium">{sub.description}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="text-[10px] uppercase h-5">
                            {sub.section || '---'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-bold tabular-nums">
                          <span className={cn(
                              "text-xs px-2 py-1 rounded-md border",
                              isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-destructive/5 text-destructive border-destructive/10"
                          )}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPassed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                isPassed ? "text-emerald-600" : "text-destructive"
                            )}>
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
          </Card>
        ) : (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No records found for this report.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
