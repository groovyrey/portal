'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Eye, 
  History, 
  LifeBuoy, 
  Settings, 
  LogOut,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import { AnimatePresence } from 'framer-motion';
import { APP_VERSION } from '@/lib/version';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';

import { Student } from '@/types';
// Tab Components
import ProfileTab from '@/components/settings/ProfileTab';
import SecurityTab from '@/components/settings/SecurityTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import PrivacyTab from '@/components/settings/PrivacyTab';
import ActivityTab from '@/components/settings/ActivityTab';
import SupportTab from '@/components/settings/SupportTab';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'privacy' | 'activity' | 'support';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { student } = useStudent();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'notifications', 'privacy', 'activity', 'support'].includes(tab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (student !== undefined) {
      setLoading(false);
    }
  }, [student]);

  const updateSettings = async (newSettings: Student['settings']) => {
    if (!student) return;

    const previousRaw = localStorage.getItem('student_data');
    const previousStudent = previousRaw ? JSON.parse(previousRaw) : student;

    const updatedStudent = { ...student, settings: newSettings };
    localStorage.setItem('student_data', JSON.stringify(updatedStudent));
    window.dispatchEvent(new Event('local-storage-update'));

    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Preferences Updated');
    } catch {
      localStorage.setItem('student_data', JSON.stringify(previousStudent));
      window.dispatchEvent(new Event('local-storage-update'));
      toast.error('Failed to sync settings');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/student/logout', { method: 'POST' });
      localStorage.removeItem('student_data');
      
      queryClient.setQueryData(['student-data'], null);
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
      
      window.dispatchEvent(new Event('local-storage-update'));
      toast.success('Session Terminated');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuring Environment...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, desc: 'Identity' },
    { id: 'security', name: 'Security', icon: Lock, desc: 'Authentication' },
    { id: 'notifications', name: 'Alerts', icon: Bell, desc: 'Signals' },
    { id: 'privacy', name: 'Privacy', icon: Eye, desc: 'Visibility' },
    { id: 'activity', name: 'History', icon: History, desc: 'Logs' },
    { id: 'support', name: 'Support', icon: LifeBuoy, desc: 'Assistance' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Terminal"
      icon={Settings}
      subtitle="Settings & Preferences"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerRight={
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
        </button>
      }
      sidebarFooter={
        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg transition-all text-red-600 font-black group"
          >
            <div className="flex items-center gap-3">
              <LogOut size={16} />
              <span className="text-[10px] uppercase tracking-widest">Terminate Session</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>
          <div className="px-1 text-center">
            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Control Center v{APP_VERSION}</p>
          </div>
        </div>
      }
    >
      <div className="surface-neutral rounded-xl border border-border/50 p-6 md:p-8 shadow-sm ring-1 ring-black/5 min-h-[500px]">
        {activeTab === 'profile' && <ProfileTab student={student} updateSettings={updateSettings} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab student={student} updateSettings={updateSettings} />}
        {activeTab === 'privacy' && <PrivacyTab student={student} updateSettings={updateSettings} />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'support' && <SupportTab />}
      </div>
    </TabbedPageLayout>
  );
}
