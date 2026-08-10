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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

  const stats = [
    { icon: <Activity className="h-3.5 w-3.5" />, label: 'Version', value: APP_VERSION },
    { icon: <Timer className="h-3.5 w-3.5" />, label: 'Latency', value: latency ? `${latency}ms` : '--' },
    { icon: <Server className="h-3.5 w-3.5" />, label: 'Environment', value: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV' },
    {
      icon: <HeartPulse className={cn("h-3.5 w-3.5", !statusData ? "text-destructive" : "text-emerald-500")} />,
      label: 'Status',
      value: !statusData ? 'DOWN' : (latency && latency > 1000 ? 'SLOW' : 'OK'),
      valueClass: !statusData ? "text-destructive" : "text-emerald-600"
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
            className="h-8 rounded-full gap-2 px-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {stat.icon}
                <span className="text-[10px] font-bold uppercase tracking-tight truncate">{stat.label}</span>
              </div>
              <p className={cn("text-sm font-bold font-mono truncate", stat.valueClass)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showOnlineModal} onOpenChange={setShowOnlineModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
            <DialogDescription>Students currently connected via Ably.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
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
                <p className="text-center py-10 text-xs text-muted-foreground uppercase font-bold tracking-widest">No active users</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
