'use client';

import { useState, useEffect } from 'react';
import { Student } from '../../types';
import Link from 'next/link';

export default function OfferedSubjectsPage() {
  const [student, setStudent] = useState<Student | null>(null);
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
               <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                {student.offeredSubjects.length} Total
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
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
