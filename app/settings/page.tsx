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
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useStudent } from '@/lib/hooks';
import { APP_VERSION } from '@/lib/version';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as SettingsTab);
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
      toast.success('Logged out');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-xs font-medium text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, desc: 'Personal info' },
    { id: 'security', name: 'Security', icon: Lock, desc: 'Login safety' },
    { id: 'notifications', name: 'Alerts', icon: Bell, desc: 'Update settings' },
    { id: 'privacy', name: 'Privacy', icon: Eye, desc: 'App visibility' },
    { id: 'activity', name: 'History', icon: History, desc: 'Login logs' },
    { id: 'support', name: 'Support', icon: LifeBuoy, desc: 'Get help' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Settings"
      icon={Settings}
      subtitle="Manage your preferences"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerRight={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      }
      sidebarFooter={
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-between hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border-border group"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
          </Button>
          <div className="px-1 text-center">
            <p className="text-[10px] text-muted-foreground/40 font-medium">Version {APP_VERSION}</p>
          </div>
        </div>
      }
    >
      <Card className="min-h-[500px]">
        <CardContent className="p-6 md:p-8">
          {activeTab === 'profile' && <ProfileTab student={student} updateSettings={updateSettings} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab student={student} updateSettings={updateSettings} />}
          {activeTab === 'privacy' && <PrivacyTab student={student} updateSettings={updateSettings} />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'support' && <SupportTab />}
        </CardContent>
      </Card>
    </TabbedPageLayout>
  );
}
