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
      toast.success('Settings updated');
    } catch {
      localStorage.setItem('student_data', JSON.stringify(previousStudent));
      window.dispatchEvent(new Event('local-storage-update'));
      toast.error('Failed to save settings');
    }
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

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, desc: 'Personal Information' },
    { id: 'security', name: 'Security', icon: Lock, desc: 'Password & Auth' },
    { id: 'notifications', name: 'Alerts', icon: Bell, desc: 'Push Preferences' },
    { id: 'privacy', name: 'Privacy', icon: Eye, desc: 'Visibility & Data' },
    { id: 'activity', name: 'Activity', icon: History, desc: 'Action History' },
    { id: 'support', name: 'Support', icon: LifeBuoy, desc: 'Feedback & Help' },
  ] as const;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 lg:pb-0">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight uppercase">Settings</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold">Preferences</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

          <div className="p-4 border-t border-border/50 space-y-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all text-red-600 font-bold group"
            >
              <div className="flex items-center gap-3">
                <LogOut size={16} />
                <span className="text-xs">Sign Out</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="px-3 pt-2">
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight text-center">Version {APP_VERSION}</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">Settings</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Sign Out</span>
            </button>
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-muted/30 p-2 border-b border-border overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.name}
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-1">
                  {tabs.find(t => t.id === activeTab)?.desc}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <div key={activeTab} className="animate-fade-in-up">
                  {activeTab === 'profile' && <ProfileTab student={student} updateSettings={updateSettings} />}
                  {activeTab === 'security' && <SecurityTab />}
                  {activeTab === 'notifications' && <NotificationsTab student={student} updateSettings={updateSettings} />}
                  {activeTab === 'privacy' && <PrivacyTab student={student} updateSettings={updateSettings} />}
                  {activeTab === 'activity' && <ActivityTab />}
                  {activeTab === 'support' && <SupportTab />}
                </div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
