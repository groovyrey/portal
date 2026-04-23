'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Loader2,
  Users,
  ShieldCheck,
  BarChart3,
  Activity,
  Mail,
} from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';

import ManageTab from '@/components/admin/ManageTab';
import StatsTab from '@/components/admin/StatsTab';
import MonitoringTab from '@/components/admin/MonitoringTab';
import EmailTab from '@/components/admin/EmailTab';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'manage' | 'stats' | 'monitoring' | 'email'>('manage');
  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['manage', 'stats', 'monitoring', 'email'].includes(tab)) {
      setActiveTab(tab as 'manage' | 'stats' | 'monitoring' | 'email');
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'manage' | 'stats' | 'monitoring' | 'email') => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background p-8">
        <div className="max-w-5xl mx-auto h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-8">
        <div className="max-w-md mx-auto mt-10 bg-card border border-border rounded-lg p-6 space-y-4 text-center">
          <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground uppercase tracking-tight">Access Denied</h1>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'manage', name: 'Manage Users', icon: Users, desc: 'Badges & Registry' },
    { id: 'email', name: 'Email center', icon: Mail, desc: 'Mass Messaging' },
    { id: 'stats', name: 'Statistics', icon: BarChart3, desc: 'Growth & Metrics' },
    { id: 'monitoring', name: 'Monitoring', icon: Activity, desc: 'System Health' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Admin Panel"
      icon={ShieldCheck}
      subtitle="Registry Access"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sidebarFooter={
        <div className="p-3 rounded-lg bg-background border border-border">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-[11px] font-bold break-words text-foreground">{currentUser.name}</p>
        </div>
      }
    >
      {activeTab === 'manage' && <ManageTab />}
      {activeTab === 'email' && <EmailTab />}
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'monitoring' && <MonitoringTab />}
    </TabbedPageLayout>
  );
}

