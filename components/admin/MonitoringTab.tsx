'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Bell,
  CreditCard,
  Server,
  Zap,
  Trash2,
  HeartPulse,
  History,
  Activity,
  ShieldCheck,
  Globe,
  Database,
  Timer
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { useRealtime } from '@/components/shared/RealtimeProvider';
import { APP_VERSION } from '@/lib/version';

export default function MonitoringTab() {
  const { onlineMembers } = useRealtime();
  const [latency, setLatency] = useState<number | null>(null);

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
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: <Server className="h-4 w-4 text-blue-500" />,
      data: statusData?.jobs?.maintenance
    }
  ];

  const services = [
    { name: 'Database', provider: 'Firestore', status: statusData ? 'Operational' : 'Unknown', icon: <Database size={12} /> },
    { name: 'Realtime', provider: 'Ably', status: onlineMembers ? 'Connected' : 'Disconnected', icon: <Globe size={12} /> },
    { name: 'Security', provider: 'AES-256', status: 'Active', icon: <ShieldCheck size={12} /> },
  ];

  // Combine and sort logs
  const combinedActivity = [
    ...(statusData?.history || []).map((run: any) => ({
      type: 'cron',
      id: run.id,
      time: run.lastRun,
      label: run.jobId.split('-')[0],
      detail: run.tasks?.join(', ') || 'No tasks listed',
      status: 'SUCCESS'
    })),
    ...(adminLogsData?.logs || []).map((log: any) => ({
      type: 'admin',
      id: log.id,
      time: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp,
      label: 'ADMIN',
      detail: `${log.adminName}: ${log.action} ${log.targetName || ''}`,
      status: 'LOGGED'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">System Health</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
              {onlineMembers.size} Active {onlineMembers.size === 1 ? 'User' : 'Users'}
            </span>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading || isRefetching}
          className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          title="Refresh Status"
        >
          <RefreshCw size={14} className={isLoading || isRefetching ? 'animate-spin' : 'text-muted-foreground'} />
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity size={12} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Version</span>
          </div>
          <p className="text-sm font-black font-mono">{APP_VERSION}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Timer size={12} />
            <span className="text-[10px] font-bold uppercase tracking-tight">API Latency</span>
          </div>
          <p className="text-sm font-black font-mono">{latency ? `${latency}ms` : '--'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Server size={12} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Environment</span>
          </div>
          <p className="text-sm font-black font-mono uppercase">{process.env.NODE_ENV === 'production' ? 'Prod' : 'Dev'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HeartPulse size={12} className={latency && latency > 1000 ? "text-amber-500" : "text-emerald-500"} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Status</span>
          </div>
          <p className={`text-sm font-black uppercase ${
            !statusData ? 'text-red-500' : (latency && latency > 1000 ? 'text-amber-500' : 'text-emerald-500')
          }`}>
            {!statusData ? 'Degraded' : (latency && latency > 1000 ? 'Lagging' : 'Optimal')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Services & Jobs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Infrastructure</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                    <Database size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground leading-none">Database</p>
                    <p className="text-[9px] text-muted-foreground">Firestore</p>
                  </div>
                </div>
                <div className={`text-[9px] font-black uppercase ${statusData ? 'text-emerald-500' : 'text-red-500'}`}>
                  {statusData ? 'Operational' : 'Error'}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                    <Globe size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground leading-none">Realtime</p>
                    <p className="text-[9px] text-muted-foreground">Ably</p>
                  </div>
                </div>
                <div className={`text-[9px] font-black uppercase text-emerald-500`}>
                  Connected
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                    <ShieldCheck size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground leading-none">Security</p>
                    <p className="text-[9px] text-muted-foreground">AES-256</p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase text-emerald-500">
                  Active
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Automated Jobs</h3>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="p-3 bg-card border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {job.icon}
                      <div>
                        <p className="text-[10px] font-bold">{job.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {job.data?.lastRun 
                            ? new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${job.data?.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  </div>
                  
                  {job.id === 'daily' && job.data?.results && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                      <div className="bg-muted/30 p-1.5 rounded-md text-center">
                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Class Emails</p>
                        <p className="text-xs font-black">{job.data.results.schedule?.emailed || 0}</p>
                      </div>
                      <div className="bg-muted/30 p-1.5 rounded-md text-center">
                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Payment Emails</p>
                        <p className="text-xs font-black">{job.data.results.payments?.emailed || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Combined Activity */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Unified Activity Stream</h3>
          <div className="bg-muted/30 border border-border rounded-xl overflow-hidden font-mono">
            <div className="p-4 overflow-x-auto min-h-[300px]">
              {isLoading ? (
                  <div className="space-y-3 opacity-20">
                      {[...Array(8)].map((_, i) => <div key={i} className="h-2 w-full bg-foreground rounded" />)}
                  </div>
              ) : combinedActivity.length > 0 ? (
                  <div className="space-y-2">
                      {combinedActivity.map((event) => (
                          <div key={event.id} className="flex gap-4 text-[10px] whitespace-nowrap group hover:bg-foreground/5 p-1 rounded transition-colors">
                              <span className="text-muted-foreground/50 w-8">
                                  {new Date(event.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`font-bold uppercase w-12 ${event.type === 'admin' ? 'text-blue-500' : 'text-amber-500'}`}>
                                  {event.label}
                              </span>
                              <span className={`w-14 font-bold ${event.status === 'SUCCESS' ? 'text-emerald-500/80' : 'text-primary/60'}`}>
                                  {event.status}
                              </span>
                              <span className="text-muted-foreground/60 truncate max-w-md group-hover:text-foreground transition-colors">
                                  {event.detail}
                              </span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                    <History size={24} className="mb-2" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">No activity recorded</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
