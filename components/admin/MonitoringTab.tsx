'use client';

import React from 'react';
import { 
  Activity, 
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
      icon: <Zap className="text-amber-500 h-5 w-5" />,
      desc: 'Consolidated daily tasks: Schedule reminders, payment alerts, and user notifications.',
      data: statusData?.jobs?.daily
    },
    {
      id: 'maintenance',
      name: 'System Maintenance',
      icon: <Server className="text-blue-500 h-5 w-5" />,
      desc: 'Database cleanup, log rotation, and infrastructure health monitoring.',
      data: statusData?.jobs?.maintenance
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Infrastructure Pulse: Optimal</span>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-[10px] font-black text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm active:scale-95"
        >
          <RefreshCw size={12} className={isLoading || isRefetching ? 'animate-spin' : ''} />
          {isLoading || isRefetching ? 'Syncing...' : 'Force Refresh'}
        </button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-border bg-card p-6 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-110">
            <Activity className="h-20 w-20" />
          </div>
          <h2 className="font-black uppercase flex items-center gap-2 text-foreground mb-4 text-[10px] tracking-widest border-b border-border pb-3">
            Service Consolidation
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed font-bold text-xs uppercase tracking-tight max-w-md">
              Optimized for Vercel Free Runtime. Two primary containers execute multiple scheduled sub-tasks using a day-specific execution map.
            </p>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Runtime</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} className="text-primary" />
                <span>{statusData?.date || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-6 rounded-3xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-110">
            <ShieldCheck className="h-16 w-16" />
          </div>
          <h2 className="font-black uppercase flex items-center gap-2 text-foreground mb-4 text-[10px] tracking-widest border-b border-border pb-3">
            Cluster Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Plan</span>
              <span className="font-black text-foreground text-[10px] uppercase text-emerald-500">Free Tier</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Job Slots</span>
              <span className="font-black text-primary text-[10px] uppercase">02 / 02 Used</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Limit</span>
              <span className="font-black text-foreground text-[10px] uppercase">20 Logs/Job</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Registry & Schedule Map */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 ml-1 mb-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="font-black uppercase tracking-[0.2em] text-muted-foreground text-[10px]">Pipeline Blueprint & Weekly Map</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Pipeline Registry */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl"><Zap className="h-4 w-4 text-amber-500" /></div>
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-tight text-foreground">Daily Pipeline</h3>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Runs 06:00 AM Manila</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="p-3 bg-accent/30 rounded-2xl border border-border/50">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Persistent Tasks (Everyday)</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-card rounded-lg text-[9px] font-bold border border-border">Schedule Reminders</span>
                            <span className="px-2 py-1 bg-card rounded-lg text-[9px] font-bold border border-border">Payment Alerts</span>
                        </div>
                    </div>
                    <div className="p-3 bg-accent/30 rounded-2xl border border-border/50">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Scheduled Events</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground">Monday</span>
                                <span className="text-[8px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-black uppercase">Weekly Summary</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground">Wednesday</span>
                                <span className="text-[8px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-black uppercase">Mid-Week Check</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground">Friday</span>
                                <span className="text-[8px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-black uppercase">Weekend Preview</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Pipeline Registry */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl"><Server className="h-4 w-4 text-blue-500" /></div>
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-tight text-foreground">Maintenance Pipeline</h3>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Runs 08:00 AM Manila</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="p-3 bg-accent/30 rounded-2xl border border-border/50">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Persistent Tasks (Everyday)</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-card rounded-lg text-[9px] font-bold border border-border">Health Check</span>
                        </div>
                    </div>
                    <div className="p-3 bg-accent/30 rounded-2xl border border-border/50">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Scheduled Events</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground">Sunday</span>
                                <span className="text-[8px] px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded font-black uppercase">DB Deep Clean</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-foreground">Wednesday</span>
                                <span className="text-[8px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded font-black uppercase">Log Rotation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Latest Runs */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3 ml-1 mb-2">
            <Server className="h-4 w-4 text-primary" />
            <h2 className="font-black uppercase tracking-[0.2em] text-muted-foreground text-[10px]">Active Pipelines</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2].map(i => (
              <div key={i} className="bg-card border border-border p-8 rounded-3xl animate-pulse space-y-4">
                <div className="h-4 w-48 bg-accent rounded-full" />
                <div className="h-2 w-full bg-accent rounded-full" />
                <div className="h-12 w-full bg-accent/50 rounded-2xl" />
              </div>
            ))
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-card border border-border rounded-3xl overflow-hidden hover:border-muted-foreground/30 transition-all shadow-sm group">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center shrink-0 border border-border/50 group-hover:scale-110 transition-transform">
                      {job.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-foreground text-sm uppercase tracking-tight">
                          {job.name}
                        </h3>
                        {job.data?.status === 'success' && (
                          <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md font-black uppercase">Online</span>
                        )}
                      </div>
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wide mt-1 max-w-md leading-relaxed">{job.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {job.data?.status === 'success' ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-black uppercase text-[9px] tracking-widest">
                        <CheckCircle2 size={12} /> Pipeline Success
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 font-black uppercase text-[9px] tracking-widest">
                        <Clock size={12} /> Idle / Waiting
                      </div>
                    )}
                  </div>
                </div>

                {job.data?.status === 'success' && (
                  <div className="bg-accent/30 border-t border-border px-8 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                        <div className="space-y-1">
                            <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest">Last Cycle</span>
                            <span className="font-black text-foreground text-sm tracking-tight">
                                {new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                        <div className="col-span-1 md:col-span-3">
                            <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-1">Tasks Executed</span>
                            <div className="flex flex-wrap gap-2">
                                {job.data.tasks?.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 bg-card border border-border rounded text-[9px] font-bold text-foreground lowercase tracking-tighter">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Specific Details based on Job ID */}
                    <div className="bg-card/50 rounded-2xl p-4 border border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {job.id === 'daily' && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg"><Bell className="h-3.5 w-3.5 text-blue-500" /></div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">Schedule Alerts</p>
                                            <p className="text-xs font-black text-foreground">{job.data.results?.schedule?.notified || 0} Sent</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg"><CreditCard className="h-3.5 w-3.5 text-emerald-500" /></div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">Finance Reminders</p>
                                            <p className="text-xs font-black text-foreground">{job.data.results?.payments?.notified || 0} Sent</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {job.id === 'maintenance' && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg"><Trash2 className="h-3.5 w-3.5 text-rose-500" /></div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">Storage Cleanup</p>
                                            <p className="text-xs font-black text-foreground">{job.data.results?.cleanup?.deletedNotifications || 0} Objects</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg"><HeartPulse className="h-3.5 w-3.5 text-indigo-500" /></div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">Health Status</p>
                                            <p className="text-xs font-black text-foreground capitalize">{job.data.results?.health?.database || 'Stable'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3 ml-1 mb-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="font-black uppercase tracking-[0.2em] text-muted-foreground text-[10px]">Execution History (Last 20)</h2>
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-accent/50 border-b border-border">
                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pipeline</th>
                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tasks</th>
                            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-accent rounded w-full" /></td>
                                </tr>
                            ))
                        ) : statusData?.history?.length > 0 ? (
                            statusData.history.map((run: any) => (
                                <tr key={run.id} className="hover:bg-accent/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col font-black">
                                            <span className="text-xs text-foreground uppercase tracking-tight">
                                                {new Date(run.lastRun).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground">
                                                {new Date(run.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${run.jobId.includes('daily') ? 'text-amber-500' : 'text-blue-500'}`}>
                                            {run.jobId.replace('-consolidated', '')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {run.tasks?.map((t: string) => (
                                                <span key={t} className="px-1.5 py-0.5 bg-accent rounded-[4px] text-[8px] font-bold text-muted-foreground lowercase">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Success</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    No records found in registry
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Runtime Environment Details */}
      <div className="mt-8 p-6 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl flex items-center gap-5 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-800">
        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
          <ShieldCheck size={24} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="font-black uppercase tracking-widest text-[10px] text-emerald-400 mb-1">Architecture Note</h4>
          <p className="text-slate-300 font-bold text-xs leading-relaxed">
            Consolidated pipeline active. Sub-tasks are dynamically gated based on the Weekly Execution Map to maintain Vercel runtime efficiency. Log storage limited to 20 records per cluster.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
