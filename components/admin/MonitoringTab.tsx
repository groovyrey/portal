'use client';

import React from 'react';
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
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      desc: 'Consolidated daily tasks: Schedule reminders, payment alerts, and user notifications.',
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'System Maintenance',
      icon: <Server className="h-4 w-4 text-blue-500" />,
      desc: 'Database cleanup, log rotation, and infrastructure health monitoring.',
      data: statusData?.jobs?.maintenance
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Infrastructure Pulse: Optimal</span>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 uppercase tracking-wider"
        >
          <RefreshCw size={12} className={isLoading || isRefetching ? 'animate-spin' : ''} />
          {isLoading || isRefetching ? 'Syncing...' : 'Force Refresh'}
        </button>
      </div>

      {/* Task Registry Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div key={pipeline.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-md bg-muted text-muted-foreground">
                <pipeline.icon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{pipeline.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{pipeline.time}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-[11px] text-muted-foreground mb-2 block">Persistent Base</span>
                <div className="flex flex-wrap gap-2">
                  {pipeline.tasks.map(task => (
                    <span key={task} className="px-2.5 py-1 bg-muted/50 rounded text-[11px] font-medium border border-border/50">{task}</span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <span className="text-[11px] text-muted-foreground mb-2 block">Scheduled Events</span>
                <div className="space-y-2">
                  {pipeline.events.map(event => (
                    <div key={event.day} className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground">{event.day}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase tracking-wider">
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

      {/* Active Pipelines */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
            <Zap size={13} className="text-muted-foreground" />
            Active Pipelines
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            [1, 2].map(i => (
              <div key={i} className="bg-card border border-border p-6 rounded-lg animate-pulse flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-2 w-64 bg-muted/60 rounded" />
                </div>
                <div className="h-8 w-24 bg-muted/40 rounded-lg" />
              </div>
            ))
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-card border border-border rounded-lg overflow-hidden transition-colors hover:border-border/80">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                      {job.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-sm">
                          {job.name}
                        </h3>
                        {job.data?.status === 'success' && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{job.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {job.data?.status === 'success' ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Cycle Complete
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                        <Clock size={12} /> Initializing
                      </div>
                    )}
                  </div>
                </div>

                {job.data?.status === 'success' && (
                  <div className="bg-muted/10 border-t border-border px-5 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
                        <div>
                            <span className="block text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-1">Execution Time</span>
                            <span className="font-semibold text-sm">
                                {new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                        <div className="col-span-1 md:col-span-3">
                            <span className="block text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-2">Internal Sequence</span>
                            <div className="flex flex-wrap gap-2">
                                {job.data.tasks?.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 bg-background border border-border rounded text-[11px] font-medium text-muted-foreground lowercase">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {job.id === 'daily' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Bell size={14} className="text-muted-foreground" />
                                        <span className="text-[11px] font-medium text-muted-foreground">Schedule Alerts</span>
                                    </div>
                                    <span className="text-[11px] font-semibold">{job.data.results?.schedule?.notified || 0} Sent</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={14} className="text-muted-foreground" />
                                        <span className="text-[11px] font-medium text-muted-foreground">Payments</span>
                                    </div>
                                    <span className="text-[11px] font-semibold">{job.data.results?.payments?.notified || 0} Sent</span>
                                </div>
                            </>
                        )}
                        {job.id === 'maintenance' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Trash2 size={14} className="text-muted-foreground" />
                                        <span className="text-[11px] font-medium text-muted-foreground">Data Purge</span>
                                    </div>
                                    <span className="text-[11px] font-semibold">{job.data.results?.cleanup?.deletedNotifications || 0} Objects</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <HeartPulse size={14} className="text-muted-foreground" />
                                        <span className="text-[11px] font-medium text-muted-foreground">Health</span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-600 capitalize">{job.data.results?.health?.database || 'Stable'}</span>
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

      {/* Execution Registry */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
            <History size={13} className="text-muted-foreground" />
            Execution Registry
        </h2>

        <div className="bg-[#0a0a0a] border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-[#111] border-b border-white/5 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                    <span className="ml-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">system_logs.sh</span>
                </div>
            </div>

            <div className="p-4 md:p-5 font-mono overflow-x-auto max-h-[400px]">
                {isLoading ? (
                    <div className="space-y-3 opacity-30">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-20 h-2 bg-white/10 rounded" />
                                <div className="w-full h-2 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : statusData?.history?.length > 0 ? (
                    <div className="space-y-1.5 min-w-[600px]">
                        {statusData.history.map((run: any) => (
                            <div key={run.id} className="flex items-start gap-4 text-[11px] px-2 py-1 rounded hover:bg-white/5 transition-colors">
                                <span className="text-white/30 shrink-0 w-20 select-none">
                                    [{new Date(run.lastRun).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={`shrink-0 w-24 font-bold uppercase ${run.jobId.includes('daily') ? 'text-amber-500/70' : 'text-blue-500/70'}`}>
                                    {run.jobId.replace('-consolidated', '')}
                                </span>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 flex-1">
                                    <span className="text-white/20">run:</span>
                                    {run.tasks?.map((t: string) => (
                                        <span key={t} className="text-blue-400/60">
                                            {t}.js
                                        </span>
                                    ))}
                                </div>
                                <span className="text-emerald-500/60 font-bold text-[10px]">SUCCESS</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">-- empty logs --</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
