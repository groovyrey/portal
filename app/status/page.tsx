'use client';

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  RefreshCw,
  Server,
  Terminal,
  ChevronRight,
  ShieldCheck,
  Bell,
  CreditCard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function StatusPage() {
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
      icon: <Bell className="text-blue-500" />,
      desc: 'Notifies students of their classes for the day every morning.',
      data: statusData?.jobs?.dailySchedule
    },
    {
      id: 'paymentReminder',
      name: 'Payment Reminder',
      icon: <CreditCard className="text-emerald-500" />,
      desc: 'Alerts students with installments due in 5 days.',
      data: statusData?.jobs?.paymentReminder
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-mono text-[11px] selection:bg-blue-100 pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-600" />
            <span className="font-bold uppercase tracking-tight">System_Status_Monitor</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => refetch()} 
              disabled={isLoading || isRefetching}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={10} className={isLoading || isRefetching ? 'animate-spin' : ''} />
              {isLoading || isRefetching ? 'REFRESHING...' : 'REFRESH_STATUS'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* System Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border border-slate-200 bg-white p-6 rounded-md shadow-sm">
            <h2 className="font-black uppercase flex items-center gap-2 text-slate-900 mb-4 border-b border-slate-100 pb-2">
              <Server size={14} className="text-blue-600" /> Operational Overview
            </h2>
            <div className="space-y-4">
              <p className="text-slate-500 leading-relaxed font-bold">
                LCC Hub Automated Services (Cron Jobs) are scheduled tasks that handle time-sensitive notifications and system maintenance. 
                Below is the real-time execution status for today&apos;s cycles.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status: Optimal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={12} />
                  <span className="font-bold">{statusData?.date || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-slate-200 bg-white p-6 rounded-md shadow-sm">
            <h2 className="font-black uppercase flex items-center gap-2 text-slate-900 mb-4 border-b border-slate-100 pb-2">
              <Terminal size={14} className="text-blue-600" /> Metrics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Timezone</span>
                <span className="font-bold text-slate-700">Asia/Manila (UTC+8)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Services</span>
                <span className="font-bold text-slate-700">02 Active</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Environment</span>
                <span className="font-bold text-slate-700">Production</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cron Jobs Status */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
            <Clock size={14} className="text-slate-900" />
            <h2 className="font-black uppercase tracking-widest text-slate-900">Job Execution Registry</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-md animate-pulse">
                  <div className="h-4 w-48 bg-slate-100 rounded mb-4" />
                  <div className="h-2 w-full bg-slate-50 rounded" />
                </div>
              ))
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-md overflow-hidden hover:border-blue-500/30 transition-all group shadow-sm">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                        {job.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
                          {job.name}
                          <ChevronRight size={12} className="text-slate-300" />
                        </h3>
                        <p className="text-slate-500 font-bold leading-relaxed mt-1">{job.desc}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                      {job.data?.status === 'success' ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black uppercase text-[9px]">
                            <CheckCircle2 size={10} /> COMPLETED
                          </div>
                          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">
                            Last Run: {new Date(job.data.lastRun).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 font-black uppercase text-[9px]">
                            <Clock size={10} /> PENDING
                          </div>
                          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter italic">
                            Awaiting next cycle
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {job.data?.status === 'success' && (
                    <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="block text-slate-400 text-[8px] font-black uppercase">Processed</span>
                        <span className="font-bold text-slate-700">{job.data.processed} Students</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-black uppercase">Notifications</span>
                        <span className="font-bold text-slate-700">{job.data.notified} Sent</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-black uppercase">Emails</span>
                        <span className="font-bold text-slate-700">{job.data.emailed} Sent</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-black uppercase">Ref</span>
                        <span className="font-bold text-slate-700 uppercase">{job.data.day || job.data.targetDate || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Technical Footer Info */}
        <section className="p-6 border border-slate-200 bg-white rounded-md flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Security & Integrity</h4>
            <p className="text-slate-500 font-bold mt-1">
              All scheduled tasks are executed within the Vercel Edge Runtime and authenticated via secure handshakes with the LCC Hub Scraper Service.
            </p>
          </div>
        </section>

        <footer className="text-center pt-10 border-t border-slate-200">
          <Link href="/dev" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline">
            Go to System Reference
          </Link>
          <p className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Realtime System Health Monitor • v1.2.0</p>
        </footer>
      </main>
    </div>
  );
}
