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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans text-xs selection:bg-blue-100 pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-900" />
            <span className="font-bold uppercase tracking-wider">System Status</span>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isLoading || isRefetching}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading || isRefetching ? 'animate-spin' : ''} />
            {isLoading || isRefetching ? 'REFRESHING...' : 'REFRESH'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* System Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border border-slate-200 bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold uppercase flex items-center gap-2 text-slate-900 mb-4 text-[10px] tracking-wider border-b border-slate-50 pb-3">
              Operational Overview
            </h2>
            <div className="space-y-4">
              <p className="text-slate-500 leading-relaxed font-medium">
                Automated services manage notifications and system maintenance. 
                Below is the real-time execution status for current cycles.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Optimal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                  <Calendar size={12} />
                  <span>{statusData?.date || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-slate-200 bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold uppercase flex items-center gap-2 text-slate-900 mb-4 text-[10px] tracking-wider border-b border-slate-50 pb-3">
              Metrics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Timezone</span>
                <span className="font-bold text-slate-700">Manila (UTC+8)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Services</span>
                <span className="font-bold text-slate-700">02 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">Environment</span>
                <span className="font-bold text-slate-700">Production</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cron Jobs Status */}
        <section className="space-y-4">
          <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[10px] ml-1">Job Registry</h2>

          <div className="grid grid-cols-1 gap-3">
            {isLoading ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse">
                  <div className="h-4 w-48 bg-slate-100 rounded mb-4" />
                  <div className="h-2 w-full bg-slate-50 rounded" />
                </div>
              ))
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all shadow-sm">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        {job.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {job.name}
                        </h3>
                        <p className="text-slate-500 font-medium text-xs mt-1">{job.desc}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {job.data?.status === 'success' ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-bold uppercase text-[9px]">
                          <CheckCircle2 size={10} /> COMPLETED
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 font-bold uppercase text-[9px]">
                          <Clock size={10} /> PENDING
                        </div>
                      )}
                    </div>
                  </div>

                  {job.data?.status === 'success' && (
                    <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="block text-slate-400 text-[8px] font-bold uppercase">Processed</span>
                        <span className="font-bold text-slate-700">{job.data.processed} Users</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-bold uppercase">Alerts</span>
                        <span className="font-bold text-slate-700">{job.data.notified} Sent</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-bold uppercase">Emails</span>
                        <span className="font-bold text-slate-700">{job.data.emailed} Sent</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[8px] font-bold uppercase">Last Run</span>
                        <span className="font-bold text-slate-700">{new Date(job.data.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Technical Info */}
        <section className="p-5 border border-slate-200 bg-white rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <ShieldCheck size={20} className="text-slate-400" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Infrastructure</h4>
            <p className="text-slate-500 font-medium text-xs mt-0.5">
              Scheduled tasks are executed via Vercel Edge Runtime with secure portal synchronization.
            </p>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System Monitor • v1.2.0</p>
        </footer>
      </main>
    </div>
  );
}
