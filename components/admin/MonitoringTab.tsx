'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  HeartPulse,
  Timer,
  Server,
  Activity,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useRealtime } from '@/components/shared/RealtimeProvider';
import { APP_VERSION } from '@/lib/version';
import { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CARD_THEMES, CardThemeKey } from '@/lib/card-themes';

export default function MonitoringTab() {
  const { onlineMembers } = useRealtime();
  const [latency, setLatency] = useState<number | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Student[]>([]);
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);

  const fetchOnlineDetails = async () => {
    setShowOnlineModal(true);
    if (onlineMembers.size === 0) {
      setOnlineUsers([]);
      return;
    }

    setIsFetchingOnline(true);
    try {
      const ids = Array.from(onlineMembers.keys());
      const res = await fetch('/api/admin/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (data.success) {
        setOnlineUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch online details:', err);
    } finally {
      setIsFetchingOnline(false);
    }
  };

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus, isRefetching: isStatusRefetching } = useQuery({
    queryKey: ['cron-status'],
    queryFn: async () => {
      const start = performance.now();
      const res = await fetch('/api/cron/status');
      const end = performance.now();
      setLatency(Math.round(end - start));
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    }
  });

  const handleRefresh = () => {
    refetchStatus();
  };

  const stats: { icon: React.ReactNode, label: string, value: string, valueClass?: string, theme: CardThemeKey }[] = [
    { icon: <Activity className="h-3.5 w-3.5" />, label: 'Version', value: APP_VERSION, theme: 'sky' },
    { icon: <Timer className="h-3.5 w-3.5" />, label: 'Latency', value: latency ? `${latency}ms` : '--', theme: 'amber' },
    { icon: <Server className="h-3.5 w-3.5" />, label: 'Environment', value: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV', theme: 'violet' },
    {
      icon: <HeartPulse className={cn("h-3.5 w-3.5", !statusData ? "text-destructive" : "text-emerald-500 dark:text-emerald-400")} />,
      label: 'Status',
      value: !statusData ? 'DOWN' : (latency && latency > 1000 ? 'SLOW' : 'OK'),
      valueClass: !statusData ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
      theme: 'emerald',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">System Health</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOnlineDetails}
            className="h-8 gap-2 px-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium">
              {onlineMembers.size} Online
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isStatusLoading || isStatusRefetching}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", (isStatusLoading || isStatusRefetching) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const t = CARD_THEMES[stat.theme];
          return (
            <Card key={stat.label} className={cn("border-border", t.bg)}>
              <CardContent className="p-3 space-y-1 min-w-0">
                <div className={cn("flex items-center gap-1.5", t.icon)}>
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", t.tile)}>
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium truncate">{stat.label}</span>
                </div>
                <p className={cn("text-sm font-bold font-mono truncate", stat.valueClass)}>{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        title="Active Sessions"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-muted-foreground mb-3">Students currently connected via Ably.</p>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 pr-4">
            {isFetchingOnline ? (
              <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : onlineUsers.length > 0 ? (
              onlineUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors">
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-xs text-muted-foreground">No active users</p>
            )}
          </div>
        </ScrollArea>
      </Modal>
    </div>
  );
}
