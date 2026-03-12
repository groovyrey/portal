'use client';

import { useState } from 'react';
import { LoginResponse } from '@/types';
import LoginForm from '@/components/auth/LoginForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardInsights from '@/components/dashboard/DashboardInsights';
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
      <div className="min-h-screen bg-background p-8">
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
    <div className="min-h-screen bg-background font-sans text-foreground pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <DashboardHeader student={student} />
        
        <DashboardInsights student={student} />
        
        <div className="max-w-5xl mx-auto space-y-6">
          {student.financials && (
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Outstanding Balance</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-foreground tabular-nums tracking-tight">
                      {student.financials.balance || '₱0.00'}
                    </span>
                    {student.financials.dueToday && student.financials.dueToday !== '₱0.00' && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-black rounded border border-rose-500/20 uppercase tracking-widest">
                        Due Today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link 
                href="/accounts" 
                className="flex items-center justify-center gap-2 bg-foreground text-background dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 group"
              >
                Financial Registry
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
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
