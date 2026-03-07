'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Loader2, 
  Users, 
  BookOpen, 
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  History,
  Activity
} from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

// Tabs
import ManageTab from '@/components/admin/ManageTab';
import KnowledgeTab from '@/components/admin/KnowledgeTab';
import StatsTab from '@/components/admin/StatsTab';
import LogsTab from '@/components/admin/LogsTab';
import MonitoringTab from '@/components/admin/MonitoringTab';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'manage' | 'knowledge' | 'stats' | 'logs' | 'monitoring'>('manage');
  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['manage', 'knowledge', 'stats', 'logs', 'monitoring'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: 'manage' | 'knowledge' | 'stats' | 'logs' | 'monitoring') => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Authentication check
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl max-w-md w-full text-center space-y-6">
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-red-500">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Access Denied</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">You do not have permission to view this page.</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
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
    { id: 'logs', name: 'Audit Logs', icon: History, desc: 'System Changes' },
    { id: 'knowledge', name: 'Knowledge', icon: BookOpen, desc: 'AI Knowledge Base' },
  ] as const;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 lg:pb-0">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight uppercase">Admin Panel</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Registry Access</p>
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

          <div className="p-4 border-t border-border/50 bg-muted/20">
            <div className="p-3 rounded-xl bg-background/50 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
              <p className="text-xs font-bold truncate text-foreground">{currentUser.name}</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">Admin Panel</span>
            </div>
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
                {tab.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.name}
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {tabs.find(t => t.id === activeTab)?.desc}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'manage' && <ManageTab key="manage" />}
                {activeTab === 'stats' && <StatsTab key="stats" />}
                {activeTab === 'monitoring' && <MonitoringTab key="monitoring" />}
                {activeTab === 'logs' && <LogsTab key="logs" />}
                {activeTab === 'knowledge' && <KnowledgeTab key="knowledge" />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
