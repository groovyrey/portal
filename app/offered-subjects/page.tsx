'use client';

import { useState, useEffect } from 'react';
import { Student } from '../../types';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';
import LottieAnimation from '@/components/LottieAnimation';
import Skeleton from '@/components/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function OfferedSubjectsPage() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: student, isLoading: loading, isError } = useQuery({
    queryKey: ['student-data'],
    queryFn: async () => {
      const response = await fetch('/api/student/me');
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        // Still sync to localStorage for dashboard's optimistic UI if needed
        localStorage.setItem('student_data', JSON.stringify(result.data));
        return result.data as Student;
      }
      throw new Error(result.error || 'Failed to fetch student data');
    }
  });

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleRefresh = async () => {
    const refreshToast = toast.loading('Refreshing subject listing...');
    try {
      await queryClient.invalidateQueries({ queryKey: ['student-data'] });
      toast.success('Subjects updated!', { id: refreshToast });
    } catch (err) {
      toast.error('Refresh failed.', { id: refreshToast });
    }
  };

  const filteredSubjects = student?.offeredSubjects?.filter(sub => 
    sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student || !student.offeredSubjects) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <LottieAnimation 
          animationPath="/animations/error-404.json"
          className="w-48 h-48 mb-4"
        />
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              {filteredSubjects.length} {searchQuery ? 'Found' : 'Total'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Full Subject Listing</h1>
              <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">Current Academic Offering</p>
            </div>
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
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub, idx) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">No subjects found matching your search.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
