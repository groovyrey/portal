'use client';

import { useState, useEffect } from 'react';
import { Student } from '../../types';
import GradesList from '../../components/GradesList';
import Link from 'next/link';

export default function GradesPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    const savedPassword = localStorage.getItem('student_pass');
    if (savedStudent && savedPassword) {
      try {
        setStudent(JSON.parse(savedStudent));
        setPassword(savedPassword);
      } catch (e) {
        console.error('Failed to parse saved student data');
      }
    }
    setIsInitialized(true);
  }, []);

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
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Reports</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Select a semester to view your grade breakdown.</p>
        </div>
        
        <GradesList reports={student.availableReports} userId={student.id} password={password} />
      </main>
    </div>
  );
}
