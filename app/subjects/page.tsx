'use client';

import { useState } from 'react';
import { Student } from '../../types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, X, ChevronRight } from 'lucide-react';
import LottieAnimation from '@/components/ui/LottieAnimation';
import Skeleton from '@/components/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function SubjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: student, isLoading: loading } = useQuery({
    queryKey: ['student-data'],
    queryFn: async () => {
      const response = await fetch('/api/student/me');
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        localStorage.setItem('student_data', JSON.stringify(result.data));
        return result.data as Student;
      }
      throw new Error(result.error || 'Failed to fetch student data');
    }
  });

  const handleRefresh = async () => {
    const refreshToast = toast.loading('Refreshing subject listing...');
    try {
      await queryClient.invalidateQueries({ queryKey: ['student-data'] });
      toast.success('Subjects updated!', { id: refreshToast });
    } catch {
      toast.error('Refresh failed.', { id: refreshToast });
    }
  };

  const filteredSubjects = student?.offeredSubjects?.filter(sub => 
    sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-accent">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <LottieAnimation 
          animationPath="/animations/error-404.json"
          className="w-48 h-48 mb-4"
        />
        <h2 className="text-xl font-bold text-foreground mb-2">No data available</h2>
        <p className="text-muted-foreground mb-6 text-sm font-medium">Please log in or refresh your data from the dashboard first.</p>
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
    <div className="min-h-screen bg-background font-sans text-foreground pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-muted-foreground transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-9 py-2 border border-border rounded-xl bg-card text-sm focus:outline-none focus:border-slate-400 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 bg-card hover:bg-accent text-muted-foreground font-bold rounded-xl border border-border transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh Listing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl uppercase tracking-wider">
              {filteredSubjects.length} {searchQuery ? 'Found' : 'Total'}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ChevronRight className="h-4 w-4 rotate-90" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">Academic Catalog</h1>
              <p className="text-muted-foreground text-[10px] font-medium mt-0.5 uppercase tracking-wider">Official Subject Listing</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-accent/50 border-b border-border">
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Units</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => router.push(`/subjects/${encodeURIComponent(sub.code)}`)}
                      className="hover:bg-accent/50 transition-all cursor-pointer group"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-muted-foreground font-mono bg-accent px-2 py-1 rounded group-hover:bg-card group-hover:text-blue-600 dark:text-blue-400 border border-transparent group-hover:border-border transition-all">
                          {sub.code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-foreground leading-tight uppercase group-hover:text-foreground transition-colors">{sub.description}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold text-muted-foreground">
                          {parseFloat(sub.units).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end">
                          <div className="h-7 w-7 rounded-lg bg-accent text-muted-foreground group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <p className="text-muted-foreground text-sm font-medium">No matches found.</p>
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
