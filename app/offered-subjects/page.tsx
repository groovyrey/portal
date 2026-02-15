'use client';

import { useState, useEffect } from 'react';
import { Student, LoginResponse } from '../../types';
import Link from 'next/link';

export default function OfferedSubjectsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch (e) {
        console.error('Failed to parse saved student data');
      }
    }
    setIsInitialized(true);
  }, []);

  const handleRefresh = async () => {
    if (!student) return;
    setLoading(true);
    setError(null);

    try {
      // Refresh session/data using HttpOnly cookie (no credentials sent)
      const response = await fetch('/api/student/me');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setStudent(result.data);
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
      } else {
        setError(result.error || 'Refresh failed. Your session may have expired.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student || !student.offeredSubjects) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No data available</h2>
        <p className="text-slate-500 mb-6 text-sm">Please log in or refresh your data from the dashboard first.</p>
        <Link 
          href="/" 
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <span className="font-bold text-lg tracking-tight text-slate-800">Offered Subjects</span>
            </div>
            <div className="flex items-center gap-2">
               <button
                onClick={handleRefresh}
                disabled={loading}
                className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-[10px] transition-all flex items-center gap-2 uppercase tracking-tighter ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
               <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1.5 rounded-md border border-slate-200 uppercase tracking-tighter">
                {student.offeredSubjects.length} Total
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Full Subject Listing</h1>
            <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">School Year 2025-2026 - 2nd Semester</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Units</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pre-requisite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {student.offeredSubjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-50">
                        {sub.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 leading-tight">{sub.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-slate-600">
                        {parseFloat(sub.units).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${sub.preReq ? 'text-slate-400' : 'text-slate-300'}`}>
                        {sub.preReq || 'None'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
