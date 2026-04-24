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
  Timer,
  User,
  Users,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtime } from '@/components/shared/RealtimeProvider';
import { APP_VERSION } from '@/lib/version';
import Modal from '@/components/ui/Modal';
import { Student } from '@/types';

export default function MonitoringTab() {
  const { onlineMembers } = useRealtime();
  const [latency, setLatency] = useState<number | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Student[]>([]);
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);

  const fetchOnlineDetails = async () => {
    if (onlineMembers.size === 0) {
      setOnlineUsers([]);
      setShowOnlineModal(true);
      return;
    }

    setIsFetchingOnline(true);
    setShowOnlineModal(true);
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
      schedule: '6:00 AM PHT (Daily)',
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'System Maintenance',
      path: '/api/cron/maintenance',
      schedule: '8:00 AM PHT (Daily)',
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
          <button 
            onClick={fetchOnlineDetails}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
              {onlineMembers.size} Active {onlineMembers.size === 1 ? 'User' : 'Users'}
            </span>
            <Users size={10} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
          </button>
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
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Cloud Infrastructure</h3>
            <div className="space-y-2">
              <div className="p-3 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                      <Database size={12} />
                    </div>
                    <p className="text-[10px] font-bold text-foreground">Core Database</p>
                  </div>
                  <div className={`text-[9px] font-black uppercase ${statusData ? 'text-emerald-500' : 'text-red-500'}`}>
                    {statusData ? 'Operational' : 'Error'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-muted/30 p-1.5 rounded-lg border border-border/50">
                  <div className="text-muted-foreground">PROVIDER: <span className="text-foreground font-bold">Firestore</span></div>
                  <div className="text-muted-foreground">TYPE: <span className="text-foreground font-bold">NoSQL</span></div>
                  <div className="text-muted-foreground">MODE: <span className="text-foreground font-bold">Native</span></div>
                  <div className="text-muted-foreground">REGION: <span className="text-foreground font-bold">us-central</span></div>
                </div>
              </div>

              <div className="p-3 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                      <Globe size={12} />
                    </div>
                    <p className="text-[10px] font-bold text-foreground">Realtime Network</p>
                  </div>
                  <div className="text-[9px] font-black uppercase text-emerald-500">Connected</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-muted/30 p-1.5 rounded-lg border border-border/50">
                  <div className="text-muted-foreground">STACK: <span className="text-foreground font-bold">Ably SDK</span></div>
                  <div className="text-muted-foreground">PROTO: <span className="text-foreground font-bold">WSS/PubSub</span></div>
                  <div className="text-muted-foreground">CHANNELS: <span className="text-foreground font-bold">2 Active</span></div>
                  <div className="text-muted-foreground">NODES: <span className="text-foreground font-bold">Multi-Edge</span></div>
                </div>
              </div>

              <div className="p-3 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                      <ShieldCheck size={12} />
                    </div>
                    <p className="text-[10px] font-bold text-foreground">Security Layer</p>
                  </div>
                  <div className="text-[9px] font-black uppercase text-emerald-500">Active</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-muted/30 p-1.5 rounded-lg border border-border/50">
                  <div className="text-muted-foreground">CIPHER: <span className="text-foreground font-bold">AES-256</span></div>
                  <div className="text-muted-foreground">AUTH: <span className="text-foreground font-bold">Custom/JWT</span></div>
                  <div className="text-muted-foreground">COOKIES: <span className="text-foreground font-bold">HttpOnly</span></div>
                  <div className="text-muted-foreground">ENCRYPT: <span className="text-foreground font-bold">CBC-IV</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">AI Intelligence</h3>
            <div className="space-y-2">
               <div className="p-3 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                      <Zap size={12} className="text-purple-500" />
                    </div>
                    <p className="text-[10px] font-bold text-foreground">LLM Orchestrator</p>
                  </div>
                  <div className="text-[9px] font-black uppercase text-emerald-500">Ready</div>
                </div>
                <div className="grid grid-cols-1 gap-1 text-[9px] font-mono bg-muted/30 p-1.5 rounded-lg border border-border/50">
                  <div className="text-muted-foreground">MODEL: <span className="text-foreground font-bold">Gemini 1.5 Pro</span></div>
                  <div className="text-muted-foreground">FRAMEWORK: <span className="text-foreground font-bold">LangChain v0.3</span></div>
                  <div className="text-muted-foreground">VOICE: <span className="text-foreground font-bold">Deepgram Nova-2</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Automated Operations</h3>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="p-3 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="mt-1">{job.icon}</div>
                      <div>
                        <p className="text-xs font-black">{job.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{job.path}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      job.data?.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600 animate-pulse'
                    }`}>
                      {job.data?.status || 'Pending'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2 border-y border-border/50">
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Last Run</p>
                      <p className="text-[10px] font-bold">
                        {job.data?.lastRun 
                          ? new Date(job.data.lastRun).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Schedule</p>
                      <p className="text-[10px] font-bold">{job.schedule}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Tasks</p>
                      <p className="text-[10px] font-bold">{job.data?.tasks?.length || 0} Executed</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Duration</p>
                      <p className="text-[10px] font-bold">{job.data?.duration ? `${(job.data.duration / 1000).toFixed(2)}s` : '--'}</p>
                    </div>
                  </div>
                  
                  {job.data?.results && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Operational Output</p>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(job.data.results).map(([key, val]: [string, any]) => (
                          <div key={key} className="bg-muted/50 p-1.5 rounded-lg border border-border/50">
                            <p className="text-[7px] text-muted-foreground uppercase font-black tracking-tight leading-none mb-1">{key}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black">{val.emailed ?? val.count ?? val.updated ?? 0}</span>
                              {val.errors > 0 && <span className="text-[8px] font-bold text-red-500">!{val.errors}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.data?.errors?.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 p-2 rounded-lg">
                      <p className="text-[8px] text-red-500 font-black uppercase tracking-widest mb-1">Critical Errors</p>
                      <div className="space-y-1">
                        {job.data.errors.slice(0, 2).map((err: string, i: number) => (
                          <p key={i} className="text-[9px] text-red-600/80 font-mono truncate">{err}</p>
                        ))}
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
      
      <Modal 
        isOpen={showOnlineModal} 
        onClose={() => setShowOnlineModal(false)}
        title={
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">Current Online Users</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Real-time presence via Ably</p>
          </div>
        }
      >
        <div className="p-5">
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 font-mono">
            {isFetchingOnline ? (
              <div className="space-y-2 opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-full bg-foreground rounded" />
                ))}
              </div>
            ) : onlineUsers.length > 0 ? (
              <div className="divide-y divide-border/50">
                {onlineUsers.map(user => (
                  <div key={user.id} className="py-2 flex items-center justify-between gap-4 group hover:bg-foreground/5 px-2 rounded transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{user.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 opacity-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No active sessions</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
