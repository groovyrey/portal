'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentQuery } from '@/lib/hooks';
import { 
  ArrowLeft, 
  Book, 
  Clock, 
  Layers, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';

export default function SubjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: student, isLoading } = useStudentQuery();

  const subjectCode = typeof id === 'string' ? decodeURIComponent(id) : '';
  const subject = student?.offeredSubjects?.find(s => s.code === subjectCode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="bg-white rounded-3xl p-8 border border-slate-200">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-md w-full">
          <div className="h-20 w-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Subject Not Found</h2>
          <p className="text-slate-500 mb-8 font-medium">We couldn't find the subject code "{subjectCode}" in your record.</p>
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
        <button 
          onClick={() => router.push('/subjects')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors group"
        >
          <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
            <ArrowLeft size={16} />
          </div>
          Back to Listing
        </button>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-8 md:p-12 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider mb-6">
              <Book size={12} />
              <span>Subject Detail</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase mb-4">
              {subject.description}
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-mono">
                {subject.code}
              </div>
              <div className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold">
                {parseFloat(subject.units).toFixed(1)} Units
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Layers size={14} className="text-blue-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Code</p>
                  <p className="text-lg font-black text-slate-900 font-mono">{subject.code}</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Credit Units</p>
                  <p className="text-lg font-black text-slate-900">{parseFloat(subject.units).toFixed(1)}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                Prerequisites
              </h3>
              <div className="p-8 rounded-[2rem] bg-emerald-50/30 border border-emerald-100/50">
                {subject.preReq ? (
                  <div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                      This subject requires completion of the following:
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm">
                      {subject.preReq}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-emerald-700">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-emerald-900">No Prerequisite</p>
                      <p className="text-xs text-emerald-600 font-medium opacity-80">This subject can be taken without any prior requirements.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="bg-blue-600 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Book size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4">Need more details?</h3>
            <p className="text-blue-100 text-sm font-medium mb-8 max-w-md leading-relaxed">
              For information regarding schedules, professors, and sections, please refer to the official enrollment dashboard or consult your department.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:opacity-90 transition-all active:opacity-70"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
