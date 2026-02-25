'use client';

import { useState } from 'react';
import { LoginResponse } from '@/types';
import LoginForm from '@/components/auth/LoginForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ScheduleTable from '@/components/dashboard/ScheduleTable';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';
import LoginProgressModal from '@/components/auth/LoginProgressModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStudentQuery } from '@/lib/hooks';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  // Use React Query for student data
  const { data: student, isLoading: isQueryLoading } = useStudentQuery();

  const loginMutation = useMutation({
    mutationFn: async ({ userId, pass }: { userId: string, pass: string }) => {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: pass }),
      });
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        localStorage.removeItem('student_pass'); 
        queryClient.setQueryData(['student-data'], result.data);
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        const displayName = result.data.parsedName ? result.data.parsedName.firstName : result.data.name;
        toast.success(`Welcome, ${displayName}!`);
        setLoginError(undefined);
      } else {
        const msg = result.error || 'Login failed. Please check your credentials.';
        setLoginError(msg);
        toast.error(msg);
      }
    },
    onError: () => {
      setLoginError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    }
  });

  const handleLogin = (userId: string, pass: string) => {
    loginMutation.mutate({ userId, pass });
  };

  if (isQueryLoading && !student) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-10 circular" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <>
        <LoginForm onLogin={handleLogin} loading={loginMutation.isPending} error={loginError} />
        <LoginProgressModal isOpen={loginMutation.isPending} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <DashboardHeader student={student} />
        
        <div className="max-w-4xl mx-auto space-y-8">
          {student.financials && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-200 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Balance</h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black tracking-tight ${student.financials.balance && student.financials.balance !== '₱0.00' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {student.financials.balance || '₱0.00'}
                    </span>
                    {student.financials.dueToday && student.financials.dueToday !== '₱0.00' && (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                        {student.financials.dueToday} Due Today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link 
                href="/accounts" 
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:shadow-blue-200 active:opacity-70 group/btn"
              >
                View Account Ledger
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {student.schedule && (
            <ScheduleTable 
              schedule={student.schedule} 
              offeredSubjects={student.offeredSubjects || undefined} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
