'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  RefreshCw,
  ShieldCheck,
  Bell,
  CreditCard,
  Server,
  Zap,
  Trash2,
  HeartPulse,
  History
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function MonitoringTab() {
  const { data: statusData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cron-status'],
    queryFn: async () => {
      const res = await fetch('/api/cron/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    }
  });

  const jobs = [
    {
      id: 'daily',
      name: 'Daily Dispatch',
      icon: <Zap className="text-amber-500 h-4 w-4" />,
      desc: 'Consolidated daily tasks: Schedule reminders, payment alerts, and user notifications.',
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'System Maintenance',
      icon: <Server className="text-blue-500 h-4 w-4" />,
      desc: 'Database cleanup, log rotation, and infrastructure health monitoring.',
      data: statusData?.jobs?.maintenance
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10 max-w-5xl mx-auto"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Infrastructure Pulse: Optimal</span>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all disabled:opacity-50 uppercase tracking-widest active:scale-95"
        >
          <RefreshCw size={12} className={isLoading || isRefetching ? 'animate-spin' : ''} />
          {isLoading || isRefetching ? 'Syncing...' : 'Force Refresh'}
        </button>
      </div>

      {/* Cluster Metrics Card */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden group transition-all hover:border-border">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/3 space-y-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
              <ShieldCheck size={14} className="text-primary" />
              Cluster Metrics
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Plan', value: 'Free Tier', color: 'text-emerald-500' },
                { label: 'Job Slots', value: '02 / 02 Used', color: 'text-primary' },
                { label: 'Limit', value: '20 Logs/Job', color: 'text-foreground' }
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                  <span className={`text-[11px] font-bold uppercase ${metric.color}`}>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-px h-24 bg-border/40" />

          <div className="w-full md:w-2/3 space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">Active Runtime</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} className="text-primary opacity-70" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{statusData?.date || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed font-medium text-xs max-w-xl">
              Cluster infrastructure is currently distributed across Vercel Edge nodes. Automated synchronization cycles are active and monitoring for upstream changes.
            </p>
          </div>
        </div>
      </div>

      {/* Task Registry Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            id: 'daily',
            title: 'Daily Pipeline',
            time: '06:00 AM Manila',
            icon: Zap,
            color: 'amber',
            tasks: ['Schedule Reminders', 'Payment Alerts'],
            events: [
              { day: 'Mon', label: 'Weekly Summary' },
              { day: 'Wed', label: 'Mid-Week Check' },
              { day: 'Fri', label: 'Weekend Preview' }
            ]
          },
          {
            id: 'maintenance',
            title: 'Maintenance Pipeline',
            time: '08:00 AM Manila',
            icon: Server,
            color: 'blue',
            tasks: ['Health Check'],
            events: [
              { day: 'Sun', label: 'DB Deep Clean' },
              { day: 'Wed', label: 'Log Rotation' }
            ]
          }
        ].map((pipeline) => (
          <div key={pipeline.id} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm group hover:border-border transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-2.5 rounded-xl bg-${pipeline.color}-500/5 border border-${pipeline.color}-500/10`}>
                <pipeline.icon size={18} className={`text-${pipeline.color}-500`} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-tight">{pipeline.title}</h3>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{pipeline.time}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Persistent Base</span>
                <div className="flex flex-wrap gap-2">
                  {pipeline.tasks.map(task => (
                    <span key={task} className="px-3 py-1 bg-accent/40 rounded-lg text-[10px] font-bold text-foreground border border-border/20">{task}</span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Scheduled Events</span>
                <div className="space-y-2.5">
                  {pipeline.events.map(event => (
                    <div key={event.day} className="flex items-center justify-between group/item">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{event.day}</span>
                      <span className="text-[10px] px-2.5 py-0.5 bg-primary/5 text-primary rounded-md font-bold uppercase tracking-wider group-hover/item:bg-primary/10 transition-colors">
                        {event.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Pipelines (Latest Runs) */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Zap size={14} className="text-primary opacity-70" />
            Active Pipelines
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2].map(i => (
              <div key={i} className="bg-card border border-border/40 p-8 rounded-2xl animate-pulse flex justify-between items-center">
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-accent rounded" />
                  <div className="h-2 w-64 bg-accent/60 rounded" />
                </div>
                <div className="h-8 w-24 bg-accent/40 rounded-xl" />
              </div>
            ))
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-border transition-all group">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-accent/50 flex items-center justify-center shrink-0 border border-border/20">
                      {job.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground text-xs uppercase tracking-tight">
                          {job.name}
                        </h3>
                        {job.data?.status === 'success' && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-md text-[9px] font-bold uppercase tracking-wider">
                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            Active
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground font-medium text-[10px] mt-1 break-words">{job.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {job.data?.status === 'success' ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/10 font-bold uppercase text-[10px] tracking-wider">
                        <CheckCircle2 size={12} /> Cycle Complete
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/10 font-bold uppercase text-[10px] tracking-wider">
                        <Clock size={12} /> Initializing
                      </div>
                    )}
                  </div>
                </div>

                {job.data?.status === 'success' && (
                  <div className="bg-accent/10 border-t border-border/40 px-6 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
                        <div>
                            <span className="block text-muted-foreground text-[9px] font-bold uppercase tracking-widest mb-1">Execution Time</span>
                            <span className="font-bold text-foreground text-xs tracking-wide">
                                {new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                        <div className="col-span-1 md:col-span-3">
                            <span className="block text-muted-foreground text-[9px] font-bold uppercase tracking-widest mb-2">Internal Sequence</span>
                            <div className="flex flex-wrap gap-2">
                                {job.data.tasks?.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 bg-background border border-border/40 rounded text-[10px] font-medium text-foreground lowercase">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {job.id === 'daily' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Bell size={14} className="text-blue-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Schedule Alerts</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground">{job.data.results?.schedule?.notified || 0} Sent</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payments</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground">{job.data.results?.payments?.notified || 0} Sent</span>
                                </div>
                            </>
                        )}
                        {job.id === 'maintenance' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Trash2 size={14} className="text-rose-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Purge</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground">{job.data.results?.cleanup?.deletedNotifications || 0} Objects</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <HeartPulse size={14} className="text-indigo-500" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Health</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-500 capitalize">{job.data.results?.health?.database || 'Stable'}</span>
                                </div>
                            </>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution Registry - Terminal Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} className="text-primary opacity-70" />
                Execution Registry
            </h2>
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Terminal_Ready</span>
            </div>
        </div>

        <div className="bg-[#0D1117] border border-border/40 rounded-2xl overflow-hidden shadow-sm relative group">
            {/* Terminal Header */}
            <div className="bg-[#161B22] border-b border-border/10 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] opacity-80" />
                    <span className="ml-3 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-medium">system_logs.sh</span>
                </div>
            </div>

            <div className="p-4 md:p-6 font-mono overflow-x-auto max-h-[450px] custom-scrollbar">
                {isLoading ? (
                    <div className="space-y-3 opacity-40">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-24 h-2 bg-white/10 rounded" />
                                <div className="w-full h-2 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : statusData?.history?.length > 0 ? (
                    <div className="space-y-2 min-w-[650px]">
                        {statusData.history.map((run: any) => (
                            <div key={run.id} className="flex items-start gap-4 text-[11px] group/line hover:bg-white/[0.03] px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-white/[0.05]">
                                <span className="text-[#484F58] shrink-0 w-24 select-none">
                                    [{new Date(run.lastRun).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={`shrink-0 w-28 font-bold uppercase tracking-tight ${run.jobId.includes('daily') ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {run.jobId.replace('-consolidated', '')}
                                </span>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 flex-1">
                                    <span className="text-[#8B949E]">run:</span>
                                    {run.tasks?.map((t: string) => (
                                        <span key={t} className="text-[#58A6FF] hover:text-white transition-colors cursor-default">
                                            {t}.js
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    <span className="text-[#7EE787] font-bold text-[10px]">SUCCESS</span>
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 flex items-center gap-2 text-[#8B949E] text-[10px]">
                            <span className="text-[#7EE787] font-bold">$</span>
                            <span className="animate-pulse">_</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-[#484F58] text-xs font-mono uppercase tracking-[0.2em]">-- log registry empty --</p>
                    </div>
                )}
            </div>

            {/* Terminal Footer */}
            <div className="bg-[#161B22]/50 border-t border-border/10 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#484F58] uppercase">History:</span>
                        <span className="text-[10px] font-mono text-white/80 font-bold">{statusData?.history?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#484F58] uppercase">Host:</span>
                        <span className="text-[10px] font-mono text-white/80 font-bold">Vercel Edge</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">OK</span>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
