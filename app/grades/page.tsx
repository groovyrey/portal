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
    const statsToast = toast.loading('Aggregating academic data...');
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
      toast.success('Analytics updated!', { id: statsToast });
    } catch (err) {
      console.error('Failed to aggregate grades', err);
      toast.error('Failed to aggregate data.', { id: statsToast });
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10 circular" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="surface-neutral rounded-xl border border-border/50 p-6 space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
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
        <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground mb-8 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed">
          Sync your portal data from the main dashboard to view scholastic records.
        </p>
        <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-lg shadow-xl hover:opacity-90 transition-all text-xs uppercase tracking-widest active:opacity-70 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <div className="bg-primary p-2.5 rounded-lg text-primary-foreground">
               <GraduationCap className="h-6 w-6" />
             </div>
             <div>
               <h1 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">Scholastic Records</h1>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">Official Registry Overview</p>
             </div>
          </div>
          <button 
            onClick={calculateStats}
            disabled={isCalculating}
            className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 shadow-lg ${
              isCalculating 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCcw className="h-3 w-3" />
                Run Analytics
              </>
            )}
          </button>
        </div>

        <div className="space-y-10">
          {allGrades.length > 0 && (
             <section>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Analytics</h2>
                </div>
                <GradeStats allGrades={allGrades} />
             </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Semester Breakdown</h2>
            </div>
            <GradesList reports={student.availableReports} />
          </section>
        </div>
      </main>
    </div>
  );
}
