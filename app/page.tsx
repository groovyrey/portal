'use client';

import { useState, useEffect } from 'react';
import { LoginResponse } from '@/types';
import LoginForm from '@/components/auth/LoginForm';
import OverviewTab from '@/components/dashboard/OverviewTab';
import ScheduleTab from '@/components/dashboard/ScheduleTab';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';
import LoginProgressModal from '@/components/auth/LoginProgressModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, School } from 'lucide-react';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';

export default function Home() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule'>('overview');
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'schedule'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'schedule');
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'overview' | 'schedule') => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

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
      setLoginResult(result);
      if (result.success && result.data) {
        localStorage.removeItem('student_pass'); 
        queryClient.setQueryData(['student-data'], result.data);
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        const displayName = result.data.parsedName ? result.data.parsedName.firstName : result.data.name;
        toast.success(`Welcome, ${displayName}!`);
      } else {
        const msg = result.error || 'Login failed. Please check your Student ID and password.';
        toast.error(msg);
      }
    },
    onError: () => {
      setLoginResult({ success: false, error: 'Network error. Please try again.' });
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
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Skeleton className="h-32 rounded-xl" />
               <Skeleton className="h-32 rounded-xl" />
               <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <>
        <LoginForm 
          onLogin={handleLogin} 
          loading={loginMutation.isPending} 
          error={loginResult?.error} 
          requiresPasswordChange={loginResult?.requiresPasswordChange}
          portalUrl={loginResult?.portalUrl}
        />
        <LoginProgressModal isOpen={loginMutation.isPending} />
      </>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, desc: 'See your progress' },
    { id: 'schedule', name: 'Schedule', icon: Calendar, desc: 'Check your classes' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Dashboard"
      icon={School}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sidebarFooter={
        <div className="p-4 rounded-xl bg-background border border-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-sm font-semibold break-words text-foreground">{student.name}</p>
        </div>
      }
    >
      {activeTab === 'overview' && <OverviewTab student={student} />}
      {activeTab === 'schedule' && <ScheduleTab schedule={student.schedule || []} />}
    </TabbedPageLayout>
  );
}

