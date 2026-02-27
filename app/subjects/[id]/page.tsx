'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentQuery } from '@/lib/hooks';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { SubjectNote } from '@/types';
import { toast } from 'sonner';
import NoteCard from '@/components/shared/NoteCard';

export default function SubjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: student, isLoading } = useStudentQuery();
  const [notes, setNotes] = useState<SubjectNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const subjectCode = typeof id === 'string' ? decodeURIComponent(id) : '';
  const subject = student?.offeredSubjects?.find(s => s.code === subjectCode);

  const fetchNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const res = await fetch(`/api/student/notes?subjectCode=${encodeURIComponent(subjectCode)}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        const err = await res.json();
        console.error('API Error:', err);
        toast.error('Could not load notes.');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Connection error.');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (subjectCode) {
      fetchNotes();
    }
  }, [subjectCode]);

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch('/api/student/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      });

      if (res.ok) {
        toast.success('Note deleted.');
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete note.');
      }
    } catch (error) {
      toast.error('Connection error.');
    }
  };

  const handleDownloadImage = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'note-attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error('Failed to download image.');
      console.error('Download error:', error);
    }
  };

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
          <p className="text-slate-500 mb-8 font-medium">We couldn&apos;t find the subject code &quot;{subjectCode}&quot; in your record.</p>
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
      <main className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
        <button 
          onClick={() => router.push('/subjects')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Listing
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-8 md:p-10 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black font-mono tracking-wider">
                {subject.code}
              </span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {parseFloat(subject.units).toFixed(1)} Units
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase">
              {subject.description}
            </h1>
          </div>

          <div className="p-8 md:p-10 space-y-10">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-600" />
                Prerequisites
              </h3>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                {subject.preReq ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Required Subjects</p>
                    <p className="text-sm font-black text-slate-900">{subject.preReq}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-tight">No Prerequisite Required</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Notes Section */}
        <section className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 px-1">
            <MessageSquare size={20} className="text-blue-600" />
            Subject Notes
          </h3>

          {/* Notes List */}
          <div className="space-y-4">
            {isLoadingNotes ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white/50 p-6 rounded-3xl border border-slate-100">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  student={student || null} 
                  onDelete={handleDeleteNote}
                  onDownloadImage={handleDownloadImage}
                />
              ))
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold">No notes yet. Be the first!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
