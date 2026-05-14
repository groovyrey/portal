'use client';

import React, { useState } from 'react';
import { 
  RefreshCw,
  Server,
  Zap,
  HeartPulse,
  History,
  Activity,
  ShieldCheck,
  Globe,
  Database,
  Timer,
  Users,
  X,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtime } from '@/components/shared/RealtimeProvider';
import { APP_VERSION } from '@/lib/version';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function MonitoringTab() {
  const { onlineMembers } = useRealtime();
  const [latency, setLatency] = useState<number | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Student[]>([]);
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);

  // Activity Modal State
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

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

  const { data: adminLogsData, isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    }
  });

  const isLoading = isStatusLoading || isLogsLoading;
  const isRefetching = isStatusRefetching;

  const handleRefresh = () => {
    refetchStatus();
    refetchLogs();
  };

  const jobs = [
    {
      id: 'daily',
      name: 'Daily Dispatch',
      path: '/api/cron/daily',
      schedule: 'Daily (6:00 AM)',
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'System Maintenance',
      path: '/api/cron/maintenance',
      schedule: 'Daily (8:00 AM)',
      icon: <Server className="h-4 w-4 text-blue-500" />,
      data: statusData?.jobs?.maintenance
    }
  ];

  const combinedActivity = [
    ...(statusData?.history || []).map((run: any) => ({
      type: 'cron',
      id: run.id,
      time: run.lastRun,
      label: run.jobId.split('-')[0],
      detail: run.tasks?.join(', ') || 'Processing',
      status: 'SUCCESS',
      rawData: run
    })),
    ...(adminLogsData?.logs || []).map((log: any) => ({
      type: 'admin',
      id: log.id,
      time: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp,
      label: 'ADMIN',
      detail: `${log.adminName}: ${log.action} ${log.targetName || ''}`,
      status: 'LOGGED',
      rawData: log
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

  const handleActivityClick = (event: any) => {
    setSelectedActivity(event);
    setShowActivityModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-[11px] font-bold tracking-tight uppercase text-muted-foreground">Health</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOnlineDetails}
            className="h-6 rounded-full gap-2 px-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
          >
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {onlineMembers.size} Online
            </span>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading || isRefetching}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="Version" value={APP_VERSION} />
        <StatCard icon={<Timer className="h-3.5 w-3.5" />} label="Latency" value={latency ? `${latency}ms` : '--'} />
        <StatCard icon={<Server className="h-3.5 w-3.5" />} label="Environment" value={process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'} />
        <StatCard 
          icon={<HeartPulse className={cn("h-3.5 w-3.5", !statusData ? "text-destructive" : "text-emerald-500")} />} 
          label="Status" 
          value={!statusData ? 'DOWN' : (latency && latency > 1000 ? 'SLOW' : 'OK')} 
          className={!statusData ? "text-destructive" : "text-emerald-600"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <section className="space-y-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Infrastructure</h4>
            <div className="grid gap-2">
              <InfrastructureItem icon={<Database className="h-3.5 w-3.5" />} label="Database" value="Turso (LibSQL)" status="Native" />
              <InfrastructureItem icon={<Globe className="h-3.5 w-3.5" />} label="Realtime" value="Ably SDK" status="Connected" />
              <InfrastructureItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Security" value="AES-256" status="Active" />
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Automated Jobs</h4>
            <div className="grid gap-2">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {job.icon}
                        <div>
                          <p className="text-xs font-bold">{job.name}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{job.path}</p>
                        </div>
                      </div>
                      <Badge variant={job.data?.status === 'success' ? "outline" : "secondary"} className="text-[8px] uppercase h-4">
                        {job.data?.status || 'Pending'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div>
                        <p className="text-muted-foreground font-semibold uppercase mb-0.5">Last Run</p>
                        <p className="font-mono">{job.data?.lastRun ? new Date(job.data.lastRun).toLocaleTimeString() : 'Never'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-semibold uppercase mb-0.5">Schedule</p>
                        <p className="font-medium">{job.schedule}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">System Activity Stream</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 font-mono text-[10px] space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : combinedActivity.map((event, i) => (
                <div 
                  key={i} 
                  onClick={() => handleActivityClick(event)}
                  className="flex gap-4 p-1 hover:bg-muted/80 rounded transition-colors group cursor-pointer border border-transparent hover:border-border/50 min-w-0"
                >
                  <span className="text-muted-foreground w-12 shrink-0">{new Date(event.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={cn("w-14 font-bold shrink-0", event.type === 'admin' ? "text-blue-500" : "text-amber-500")}>{event.label}</span>
                  <span className="flex-1 text-muted-foreground/80 group-hover:text-foreground truncate">{event.detail}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
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

      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedActivity?.type === 'admin' ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5 text-[10px] uppercase font-bold px-1.5 h-5">Admin Action</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 text-[10px] uppercase font-bold px-1.5 h-5">System Job</Badge>
              )}
              <span className="text-[10px] font-mono text-muted-foreground">
                {selectedActivity?.time && new Date(selectedActivity.time).toLocaleString()}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight">
              {selectedActivity?.type === 'admin' ? 'Administrative Log' : 'Automated Task Execution'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detailed system record for ID: <span className="font-mono">{selectedActivity?.id}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {selectedActivity?.type === 'admin' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Administrator</p>
                    <p className="text-sm font-semibold">{selectedActivity.rawData?.adminName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedActivity.rawData?.adminId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Action Type</p>
                    <p className="text-sm font-semibold text-blue-600">{selectedActivity.rawData?.action}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Target Entity</p>
                  <div className="p-2 bg-muted rounded border flex items-center justify-between">
                    <span className="text-xs font-medium">{selectedActivity.rawData?.targetName || 'System-Wide'}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedActivity.rawData?.targetId}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Modification Details</p>
                  <ScrollArea className="h-[120px] w-full rounded-md border bg-black/5 p-3">
                    <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">{selectedActivity.rawData?.details}</p>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Job Identifier</p>
                    <p className="text-sm font-semibold font-mono">{selectedActivity?.rawData?.jobId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Execution Status</p>
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 text-[10px] font-bold px-2 py-0 h-5">
                      {selectedActivity?.rawData?.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Completed Tasks</p>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted rounded border">
                    {selectedActivity?.rawData?.tasks?.map((task: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] font-medium h-5 bg-background border">{task}</Badge>
                    ))}
                    {!selectedActivity?.rawData?.tasks?.length && <p className="text-[10px] text-muted-foreground italic">No specific tasks listed</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Execution Results</p>
                  <ScrollArea className="h-[150px] w-full rounded-md border bg-black/5 p-3">
                    <div className="space-y-2">
                      {selectedActivity?.rawData?.results ? (
                        Object.entries(selectedActivity.rawData.results).map(([key, val]: [string, any], idx) => (
                          <div key={idx} className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/70">{key}</p>
                            <p className="text-xs font-mono break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                            {idx < Object.entries(selectedActivity.rawData.results).length - 1 && <Separator className="opacity-50" />}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No raw execution results stored</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowActivityModal(false)} className="text-[10px] font-bold uppercase tracking-widest h-8 px-4">
              Close Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <Card>
      <CardContent className="p-2.5 space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[9px] font-bold uppercase tracking-tight truncate">{label}</span>
        </div>
        <p className={cn("text-sm font-bold font-mono truncate", className)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InfrastructureItem({ icon, label, value, status }: { icon: React.ReactNode, label: string, value: string, status: string }) {
  return (
    <div className="p-2.5 bg-card border rounded-md flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-1 bg-muted rounded text-muted-foreground">{icon}</div>
        <div>
          <p className="text-[9px] font-bold leading-none">{label}</p>
          <p className="text-[8px] text-muted-foreground font-mono mt-0.5 uppercase">{value}</p>
        </div>
      </div>
      <Badge variant="outline" className="text-[7px] uppercase h-3.5 px-1">{status}</Badge>
    </div>
  );
}
