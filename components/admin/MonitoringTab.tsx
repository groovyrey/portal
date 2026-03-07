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
  Zap
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
      id: 'dailySchedule',
      name: 'Daily Schedule Reminder',
      icon: <Bell className="text-blue-500 h-5 w-5" />,
      desc: 'Notifies students of their classes for the day every morning.',
      data: statusData?.jobs?.dailySchedule
    },
    {
      id: 'paymentReminder',
      name: 'Payment Reminder',
      icon: <CreditCard className="text-emerald-500 h-5 w-5" />,
      desc: 'Alerts students with installments due in 5 days.',
      data: statusData?.jobs?.paymentReminder
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
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Pulse: Optimal</span>
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
            Operational Overview
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed font-bold text-xs uppercase tracking-tight max-w-md">
              Automated services manage notifications and system maintenance. 
              Execution status reflects the latest synchronization cycles.
            </p>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Core Services Active</span>
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
            <Zap className="h-16 w-16" />
          </div>
          <h2 className="font-black uppercase flex items-center gap-2 text-foreground mb-4 text-[10px] tracking-widest border-b border-border pb-3">
            Service Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Timezone</span>
              <span className="font-black text-foreground text-[10px] uppercase">Manila (UTC+8)</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Active Cron</span>
              <span className="font-black text-primary text-[10px] uppercase">02 Persistent</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">Runtime</span>
              <span className="font-black text-foreground text-[10px] uppercase">Edge Function</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cron Jobs Status */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3 ml-1 mb-2">
            <Server className="h-4 w-4 text-primary" />
            <h2 className="font-black uppercase tracking-[0.2em] text-muted-foreground text-[10px]">Job Registry & Execution Logs</h2>
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
                      <h3 className="font-black text-foreground text-sm uppercase tracking-tight flex items-center gap-2">
                        {job.name}
                      </h3>
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wide mt-1 max-w-md leading-relaxed">{job.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {job.data?.status === 'success' ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-black uppercase text-[9px] tracking-widest">
                        <CheckCircle2 size={12} /> Cycle Complete
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 font-black uppercase text-[9px] tracking-widest">
                        <Clock size={12} /> Scheduled
                      </div>
                    )}
                  </div>
                </div>

                {job.data?.status === 'success' && (
                  <div className="bg-accent/30 border-t border-border px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest">Total Processed</span>
                      <span className="font-black text-foreground text-sm tracking-tight">{job.data.processed} <span className="text-[10px] text-muted-foreground">Users</span></span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest">App Alerts</span>
                      <span className="font-black text-primary text-sm tracking-tight">{job.data.notified} <span className="text-[10px] text-muted-foreground">Sent</span></span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest">Email Delivery</span>
                      <span className="font-black text-foreground text-sm tracking-tight">{job.data.emailed} <span className="text-[10px] text-muted-foreground">Sent</span></span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-muted-foreground text-[8px] font-black uppercase tracking-widest">Last Execution</span>
                      <span className="font-black text-foreground text-sm tracking-tight">{new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Technical Infrastructure */}
      <div className="mt-8 p-6 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl flex items-center gap-5 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-800">
        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
          <ShieldCheck size={24} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="font-black uppercase tracking-widest text-[10px] text-emerald-400 mb-1">Infrastructure Layer</h4>
          <p className="text-slate-300 font-bold text-xs leading-relaxed">
            Tasks are executed via Vercel Edge Runtime. End-to-end encryption is active for all school portal synchronization cycles.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
