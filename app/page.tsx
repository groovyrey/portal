'use client';

import { useState, useEffect } from 'react';
import { LoginResponse } from '@/types';
import LoginForm from '@/components/auth/LoginForm';
import OverviewTab from '@/components/dashboard/OverviewTab';
import ScheduleTab from '@/components/dashboard/ScheduleTab';
import DailyQuestTab from '@/components/dashboard/DailyQuestTab';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';
import LoginProgressModal from '@/components/auth/LoginProgressModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, School, LogOut, ChevronRight, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'quest'>('overview');
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'schedule', 'quest'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'schedule' | 'quest');
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'overview' | 'schedule' | 'quest') => {
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
        const msg = result.error || 'Login failed. Please check your credentials.';
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

  const handleLogout = async () => {
    try {
      await fetch('/api/student/logout', { method: 'POST' });
      localStorage.removeItem('student_data');
      
      queryClient.setQueryData(['student-data'], null);
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
      
      window.dispatchEvent(new Event('local-storage-update'));
      toast.success('Logged out successfully');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
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
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
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
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, desc: 'At a glance' },
    { id: 'schedule', name: 'Schedule', icon: Calendar, desc: 'Classes & Holidays' },
    { id: 'quest', name: 'Daily Quest', icon: Trophy, desc: 'Challenge & Rewards' },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground pb-16 lg:pb-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight uppercase">Dashboard</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">LCCian Hub</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <tab.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-primary-foreground' : 'text-primary'}`} />
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">{tab.name}</p>
                  <p className={`text-[9px] mt-1 ${activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{tab.desc}</p>
                </div>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border bg-muted/10">
             <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
              <p className="text-xs font-bold break-words text-foreground">{student.name}</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden h-16 border-b border-border flex items-center gap-3 px-4 bg-background sticky top-16 z-30">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">Dashboard</span>
            </div>
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-muted/20 p-2 border-b border-border overflow-x-auto no-scrollbar sticky top-32 z-20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.name}
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-1">
                  {tabs.find(t => t.id === activeTab)?.desc}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'overview' && <OverviewTab student={student} />}
                  {activeTab === 'schedule' && <ScheduleTab 
                        schedule={student.schedule || []} 
                        offeredSubjects={student.offeredSubjects || undefined} 
                    />}
                  {activeTab === 'quest' && <DailyQuestTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
