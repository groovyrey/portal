'use client';

import { useState, useEffect } from 'react';
import { SubjectGrade } from '@/types';
import GradesList from '@/components/dashboard/GradesList';
import GradeStats from '@/components/dashboard/GradeStats';
import Link from 'next/link';
import { toast } from 'sonner';
import LottieAnimation from '@/components/ui/LottieAnimation';
import Skeleton from '@/components/ui/Skeleton';
import { useStudent } from '@/lib/hooks';
import { GraduationCap, ArrowLeft, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type ExtendedGrade = SubjectGrade & { semester: string };

export default function GradesPage() {
  const { student } = useStudent();
  const [isInitialized, setIsInitialized] = useState(false);
  const [allGrades, setAllGrades] = useState<ExtendedGrade[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

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

  const calculateStats = async () => {
    if (!student || !student.availableReports || isCalculating) return;
    setIsCalculating(true);
    const statsToast = toast.loading('Getting your grades...');
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
        toast.error('No records found.', { id: statsToast });
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
            s.description.trim().toLowerCase() === g.description.trim().toLowerCase() ||
            s.code.trim().toLowerCase() === g.code.trim().toLowerCase()
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
      toast.success('Grades updated!', { id: statsToast });
    } catch (err) {
      console.error('Failed to aggregate grades', err);
      toast.error('Failed to get your grades.', { id: statsToast });
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
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
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

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Grades</h2>
          <p className="text-muted-foreground">
            Official scholastic records and performance history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={calculateStats}
            disabled={isCalculating}
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
        </div>
      </div>

      <Separator />

      <div className="space-y-8">
        {allGrades.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Performance Summary</h3>
            </div>
            <GradeStats allGrades={allGrades} />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Grade Reports</h3>
          </div>
          <GradesList reports={student.availableReports} />
        </div>
      </div>
    </div>
  );
}
