'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Loader2,
  Users,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import ManageTab from '@/components/admin/ManageTab';
import KnowledgeTab from '@/components/admin/KnowledgeTab';
import StatsTab from '@/components/admin/StatsTab';
import MonitoringTab from '@/components/admin/MonitoringTab';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'manage' | 'knowledge' | 'stats' | 'monitoring'>('manage');
  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['manage', 'knowledge', 'stats', 'monitoring'].includes(tab)) {
      setActiveTab(tab as 'manage' | 'knowledge' | 'stats' | 'monitoring');
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'manage' | 'knowledge' | 'stats' | 'monitoring') => {
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
          <button
            onClick={() => router.push('/')}
            className="w-full bg-foreground text-background font-bold py-3 rounded-lg text-xs uppercase tracking-tight hover:opacity-90 transition-all active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'manage', name: 'Manage Users', icon: Users, desc: 'Badges & Registry' },
    { id: 'stats', name: 'Statistics', icon: BarChart3, desc: 'Growth & Metrics' },
    { id: 'monitoring', name: 'Monitoring', icon: Activity, desc: 'System Health' },
    { id: 'knowledge', name: 'Knowledge', icon: BookOpen, desc: 'AI Knowledge Base' },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground pb-16 lg:pb-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight uppercase">Admin Panel</h1>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Registry Access</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <tab.icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    activeTab === tab.id ? 'text-primary-foreground' : 'text-primary'
                  }`}
                />
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">{tab.name}</p>
                  <p className={`text-[9px] mt-1 ${activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {tab.desc}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border bg-muted/5">
            <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
              <p className="text-[11px] font-bold break-words text-foreground">{currentUser.name}</p>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden h-16 border-b border-border flex items-center gap-3 px-4 bg-background sticky top-16 z-30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">Admin Panel</span>
            </div>
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-muted/20 p-2 border-b border-border overflow-x-auto no-scrollbar sticky top-32 z-20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  {tabs.find((t) => t.id === activeTab)?.name}
                </h1>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                  {tabs.find((t) => t.id === activeTab)?.desc}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'manage' && <ManageTab />}
                  {activeTab === 'stats' && <StatsTab />}
                  {activeTab === 'monitoring' && <MonitoringTab />}
                  {activeTab === 'knowledge' && <KnowledgeTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
