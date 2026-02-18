'use client';

import { useState, useEffect } from 'react';
import { LoginResponse, Student } from '../types';
import LoginForm from '../components/LoginForm';
import DashboardHeader from '../components/DashboardHeader';
import ScheduleTable from '../components/ScheduleTable';
import PersonalInfo from '../components/PersonalInfo';
import { toast } from 'sonner';
import Skeleton from '../components/Skeleton';
import LoginProgressModal from '../components/LoginProgressModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use React Query for student data
  const { data: student, isLoading: isQueryLoading } = useQuery({
    queryKey: ['student-data'],
    queryFn: async () => {
      const res = await fetch('/api/student/me');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          localStorage.setItem('student_data', JSON.stringify(result.data));
          return result.data as Student;
        }
      }
      // If not ok or not success, return null (logged out)
      localStorage.removeItem('student_data');
      return null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  useEffect(() => {
    setIsInitialized(true);
  }, []);

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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/student/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['student-data'], null);
      localStorage.removeItem('student_data');
      localStorage.removeItem('student_pass');
      window.dispatchEvent(new Event('local-storage-update'));
      toast.success('Logged out successfully.');
    }
  });

  const handleLogin = (userId: string, pass: string) => {
    loginMutation.mutate({ userId, pass });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isInitialized || (isQueryLoading && !student)) {
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
        <DashboardHeader student={student} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {student.schedule && (
              <ScheduleTable 
                schedule={student.schedule} 
                offeredSubjects={student.offeredSubjects || undefined} 
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <PersonalInfo student={student} />
          </div>
        </div>
      </main>
    </div>
  );
}
