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
  AlertTriangle
} from 'lucide-react';
import { useStudentQuery } from '@/lib/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import ManageTab from '@/components/admin/ManageTab';
import StatsTab from '@/components/admin/StatsTab';
import MonitoringTab from '@/components/admin/MonitoringTab';
import EmailTab from '@/components/admin/EmailTab';
import IncidentsTab from '@/components/admin/IncidentsTab';

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'manage' | 'stats' | 'monitoring' | 'email' | 'incidents'>('manage');
  const { data: currentUser, isLoading: isUserLoading } = useStudentQuery();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['manage', 'stats', 'monitoring', 'email', 'incidents'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (isUserLoading) {
    return (
      <div className="flex-1 h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentUser || !currentUser.badges?.includes('staff')) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-destructive mb-4">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'manage', name: 'Users', icon: Users, desc: 'Manage profiles and badges' },
    { id: 'incidents', name: 'Incidents', icon: AlertTriangle, desc: 'View system error reports' },
    { id: 'email', name: 'Email', icon: Mail, desc: 'Send announcements' },
    { id: 'stats', name: 'Stats', icon: BarChart3, desc: 'Growth and usage metrics' },
    { id: 'monitoring', name: 'System', icon: Activity, desc: 'Check health and logs' },
  ] as const;

  return (
    <TabbedPageLayout
      title="Admin"
      icon={ShieldCheck}
      subtitle="Management Console"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sidebarFooter={
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Signed in as</p>
          <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
        </div>
      }
    >
      <div className="space-y-6">
        {activeTab === 'manage' && <ManageTab />}
        {activeTab === 'incidents' && <IncidentsTab />}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'monitoring' && <MonitoringTab />}
      </div>
    </TabbedPageLayout>
  );
}

