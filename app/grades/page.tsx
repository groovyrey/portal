'use client';

import { useState, useEffect } from 'react';
import { Student, SubjectGrade } from '../../types';
import GradesList from '../../components/GradesList';
import GradeStats from '../../components/GradeStats';
import Link from 'next/link';
import { toast } from 'sonner';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student || !student.availableReports) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No reports available</h2>
        <p className="text-slate-500 mb-6 text-sm">Please log in or refresh your data from the dashboard first.</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Reports</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Detailed breakdown of your scholastic performance.</p>
          </div>
          <button 
            onClick={calculateStats}
            disabled={isCalculating}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              isCalculating 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isCalculating ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
