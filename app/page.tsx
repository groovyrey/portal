'use client';

import { useState } from 'react';
import { LoginResponse } from '@/types';
import LoginForm from '@/components/auth/LoginForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardInsights from '@/components/dashboard/DashboardInsights';
import ScheduleTable from '@/components/dashboard/ScheduleTable';
import DailyGreeting from '@/components/dashboard/DailyGreeting';
import StatCards from '@/components/dashboard/StatCards';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DailyGreeting student={student} />
          </div>
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>
        </div>

        <StatCards student={student} />
        
        <div className="space-y-8">
          <DashboardInsights student={student} />
          
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
