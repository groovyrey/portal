'use client';

import { useState, useEffect, useRef } from 'react';
import { SubjectGrade } from '@/types';
import GradesList from '@/components/dashboard/GradesList';
import GradeStats from '@/components/dashboard/GradeStats';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import Link from 'next/link';
import { toast } from 'sonner';
import LottieAnimation from '@/components/ui/LottieAnimation';
import Skeleton from '@/components/ui/Skeleton';
import { useStudent } from '@/lib/hooks';
import { GraduationCap, ArrowLeft, RefreshCcw, Loader2, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ExtendedGrade = SubjectGrade & { semester: string };
type GradesTab = 'stats' | 'records';

export default function GradesPage() {
  const { student } = useStudent();
  const [isInitialized, setIsInitialized] = useState(false);
  const [allGrades, setAllGrades] = useState<ExtendedGrade[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<GradesTab>('stats');
  const autoSynced = useRef(false);

  useEffect(() => {
    const savedAllGrades = localStorage.getItem('all_grades_cache');
    if (savedAllGrades) {
      try {
        const parsed = JSON.parse(savedAllGrades);
        setAllGrades(parsed);
      } catch (e) {
        console.error('Failed to parse saved grades data');
      }
    }
    setIsInitialized(true);
  }, []);

  // Auto-load stats on page open instead of requiring the sync button.
  useEffect(() => {
    if (!isInitialized || autoSynced.current || !student?.availableReports) return;
    autoSynced.current = true;
    calculateStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, student]);

  const calculateStats = async (silent = false) => {
    if (!student || !student.availableReports || isCalculating) return;
    setIsCalculating(true);
    const statsToast = silent ? null : toast.loading('Getting your grades...');
    let gathered: ExtendedGrade[] = [];

    try {
      const promises = student.availableReports.map(report => 
        fetch('/api/student/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            href: report.href,
            reportName: report.text 
          }),
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);

      results.forEach((res, index) => {
        if (res.success && res.subjects && student.availableReports) {
          const semesterName = student.availableReports[index].text;
          const subjectsWithSemester = res.subjects.map((s: SubjectGrade) => ({
            ...s,
            semester: semesterName
          }));
          gathered = [...gathered, ...subjectsWithSemester];
        }
      });

      if (gathered.length === 0) {
        toast.error('No records found.', { id: statsToast || undefined });
        setIsCalculating(false);
        return;
      }

      const seen = new Set();
      let unique = gathered.filter(g => {
        const key = `${g.code}-${g.description}-${g.semester}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (student?.offeredSubjects && student.offeredSubjects.length > 0) {
        unique = unique.map(g => {
          const u = parseFloat(g.units || '0');
          const looksLikeSection = /^[A-Z]{2,}\d[A-Z]$/i.test(g.code) || g.code.includes('-');
          const currentSection = g.section || (looksLikeSection ? g.code : '');

          const match = student.offeredSubjects?.find(s => 
            (s.description?.trim()?.toLowerCase() || '') === (g.description?.trim()?.toLowerCase() || '') ||
            (s.code?.trim()?.toLowerCase() || '') === (g.code?.trim()?.toLowerCase() || '')
          );

          if (match) {
            return { 
              ...g, 
              section: currentSection,
              units: (isNaN(u) || u === 0) ? (match.units || g.units) : g.units
            };
          }

          return { ...g, section: currentSection };
        });
      }

      setAllGrades(unique);
      localStorage.setItem('all_grades_cache', JSON.stringify(unique));
      if (statsToast) toast.success('Grades updated!', { id: statsToast });
    } catch (err) {
      console.error('Failed to aggregate grades', err);
      toast.error('Failed to get your grades.', { id: statsToast || undefined });
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-9 w-[150px]" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-64 md:col-span-4" />
          <Skeleton className="h-64 md:col-span-3" />
        </div>
      </div>
    );
  }

  if (!student || !student.availableReports) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <LottieAnimation 
          animationPath="/animations/error-404.json"
          className="w-56 h-56 mb-4"
        />
        <h2 className="text-lg font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Please sync your portal data from the dashboard to view your grades.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', name: 'Stats', icon: BarChart3, desc: 'Performance summary' },
    { id: 'records', name: 'Records', icon: FileText, desc: 'Semester grade reports' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Grades"
      icon={GraduationCap}
      subtitle="Official scholastic records and performance history"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      headerRight={
        <Button
          onClick={() => calculateStats(false)}
          disabled={isCalculating}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Sync Grades
            </>
          )}
        </Button>
      }
    >
      {activeTab === 'stats' && (
        allGrades.length > 0 ? (
          <GradeStats 
            allGrades={allGrades} 
            enrolledUnits={student.schedule?.reduce((acc, curr) => acc + (parseFloat(curr.units) || 0), 0) || 0}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No stats yet</h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              Sync your grades to see your performance summary and averages.
            </p>
            <Button onClick={() => calculateStats(false)} disabled={isCalculating} variant="outline" size="sm">
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Sync Grades
                </>
              )}
            </Button>
          </div>
        )
      )}

      {activeTab === 'records' && (
        <GradesList reports={student.availableReports} />
      )}
    </TabbedPageLayout>
  );
}
