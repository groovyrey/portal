'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentQuery } from '@/lib/hooks';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function SubjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: student, isLoading } = useStudentQuery();

  const subjectCode = typeof id === 'string' ? decodeURIComponent(id) : '';
  const subject = student?.offeredSubjects?.find(s => s.code === subjectCode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="bg-card rounded-3xl p-8 border border-border">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="bg-card p-12 rounded-[2.5rem] border border-border shadow-sm max-w-md w-full">
          <div className="h-20 w-20 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Subject Not Found</h2>
          <p className="text-muted-foreground mb-8 font-medium">We couldn&apos;t find the subject code &quot;{subjectCode}&quot; in your record.</p>
          <button 
            onClick={() => router.push('/subjects')}
            className="w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl transition-all hover:bg-slate-800 active:opacity-70 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
        <button 
          onClick={() => router.push('/subjects')}
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Listing
        </button>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <div className="p-8 md:p-10 border-b border-border bg-card">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black font-mono tracking-wider">
                {subject.code}
              </span>
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {parseFloat(subject.units).toFixed(1)} Units
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight uppercase">
              {subject.description}
            </h1>
          </div>

          <div className="p-8 md:p-10 space-y-10">
            <section>
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                Prerequisites
              </h3>
              <div className="p-6 rounded-2xl bg-accent/50 border border-border">
                {subject.preReq ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Required Subjects</p>
                    <p className="text-sm font-black text-foreground">{subject.preReq}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-tight">No Prerequisite Required</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
