'use client';

import { useState, useEffect } from 'react';
import { Student, SubjectGrade } from '../../types';
import GradesList from '../../components/GradesList';
import GradeStats from '../../components/GradeStats';
import Link from 'next/link';
import { toast } from 'sonner';
import LottieAnimation from '@/components/LottieAnimation';
import Skeleton from '@/components/Skeleton';

export default function GradesPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allGrades, setAllGrades] = useState<SubjectGrade[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    const savedAllGrades = localStorage.getItem('all_grades_cache');
    
    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
        if (savedAllGrades) setAllGrades(JSON.parse(savedAllGrades));
      } catch (e) {
        console.error('Failed to parse saved student data');
      }
    }
    setIsInitialized(true);
  }, []);

  const calculateStats = async () => {
    if (!student || !student.availableReports || isCalculating) return;
    setIsCalculating(true);
    const statsToast = toast.loading('Gathering academic data across semesters...');
    let gathered: SubjectGrade[] = [];

    try {
      // Fetch each semester in parallel - Session cookie handles auth
      const promises = student.availableReports.map(report => 
        fetch('/api/student/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ href: report.href }),
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res.success && res.subjects) {
          gathered = [...gathered, ...res.subjects];
        }
      });

      if (gathered.length === 0) {
        toast.error('No grades found in your reports.', { id: statsToast });
        setIsCalculating(false);
        return;
      }

      // De-duplicate gathered grades
      const seen = new Set();
      const unique = gathered.filter(g => {
        const key = `${g.description}-${g.grade}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAllGrades(unique);
      localStorage.setItem('all_grades_cache', JSON.stringify(unique));
      toast.success('Scholastic stats calculated!', { id: statsToast });
    } catch (err) {
      console.error('Failed to gather grades for stats', err);
      toast.error('Failed to aggregate data.', { id: statsToast });
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-end">
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student || !student.availableReports) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <LottieAnimation 
          animationPath="/animations/error-404.json"
          className="w-48 h-48 mb-4"
        />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No reports available</h2>
        <p className="text-slate-500 mb-6 text-sm font-medium">Please log in or refresh your data from the dashboard first.</p>
        <Link href="/" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg transition-colors text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex justify-end mb-8">
          <button 
            onClick={calculateStats}
            disabled={isCalculating}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              isCalculating 
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div>
                Gathering Data...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                Calculate Overall Stats
              </>
            )}
          </button>
        </div>

        {allGrades.length > 0 && <GradeStats allGrades={allGrades} />}
        
        <GradesList reports={student.availableReports} />
      </main>
    </div>
  );
}
