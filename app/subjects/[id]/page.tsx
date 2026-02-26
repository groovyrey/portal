'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentQuery } from '@/lib/hooks';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  MessageSquare,
  Send,
  Image as ImageIcon,
  X
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
  const [newNote, setNewNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portal_notes');

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcozqx42z';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handlePostNote = async () => {
    if ((!newNote.trim() && !selectedFile) || !student) return;

    try {
      setIsSubmitting(true);
      
      let finalImageUrl = '';
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (!uploadedUrl) {
          toast.error('Failed to upload image.');
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode,
          content: newNote,
          userName: student.name,
          imageUrl: finalImageUrl
        })
      });

      if (res.ok) {
        setNewNote('');
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchNotes();
        toast.success('Note posted successfully!');
      } else {
        toast.error('Failed to post note.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Post Note Input */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-6 w-1 bg-blue-600 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New Note</h4>
            </div>
            
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Post a note, tip, or resource... Markdown is supported! (**bold**, # heading, etc.)"
              className="w-full min-h-[120px] p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none mb-4 placeholder:text-slate-300"
            />
            
            {previewUrl && (
              <div className="relative w-full max-w-[240px] aspect-video mb-4 rounded-2xl overflow-hidden border-2 border-slate-100 group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md scale-90 group-hover:scale-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="relative">
                <input
                  type="file"
                  id="note-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => document.getElementById('note-image')?.click()}
                  className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold active:scale-95"
                >
                  <ImageIcon size={18} />
                  {selectedFile ? 'Change Image' : 'Attach Image'}
                </button>
              </div>

              <button
                onClick={handlePostNote}
                disabled={isSubmitting || (!newNote.trim() && !selectedFile)}
                className="px-8 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-slate-200"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Post Note
              </button>
            </div>
          </div>

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
              <div className="text-center py-12 bg-slate-100/50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No notes yet. Be the first!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
