'use client';

import { useState, useEffect } from 'react';
import { Student, LoginResponse } from '../../types';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OfferedSubjectsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
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
    const refreshToast = toast.loading('Refreshing subject listing...');

    try {
      const response = await fetch('/api/student/me');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setStudent(result.data);
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        toast.success('Subjects updated!', { id: refreshToast });
      } else {
        toast.error(result.error || 'Refresh failed.', { id: refreshToast });
      }
    } catch (err) {
      toast.error('Network error. Please try again.', { id: refreshToast });
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
        <h2 className="text-xl font-bold text-slate-900 mb-2">No data available</h2>
        <p className="text-slate-500 mb-6 text-sm font-medium">Please log in or refresh your data from the dashboard first.</p>
        <Link 
          href="/" 
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg transition-colors text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex justify-end gap-2 mb-8">
           <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-2 uppercase tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
           <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wider">
            {student.offeredSubjects.length} Total
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h1 className="text-lg font-bold text-slate-900">Full Subject Listing</h1>
            <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">Current Academic Offering</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Units</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Pre-requisite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {student.offeredSubjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                        {sub.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 leading-tight uppercase">{sub.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-600">
                        {parseFloat(sub.units).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${sub.preReq ? 'text-slate-500' : 'text-slate-300'}`}>
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
