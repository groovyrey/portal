'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Clock, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { SubjectNote, Student } from '@/types';
import { CldImage } from 'next-cloudinary';

interface NoteCardProps {
  note: SubjectNote;
  student: Student | null;
  onDelete?: (noteId: string) => void;
  onDownloadImage?: (url: string, fileName: string) => void;
}

export default function NoteCard({
  note,
  student,
  onDelete,
  onDownloadImage
}: NoteCardProps) {
  const isOwner = student?.id === note.userId;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden group">
      <div className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-white">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{note.userName}</p>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {note.createdAt?.seconds 
                    ? new Date(note.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              title="Delete Note"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {note.content && (
          <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-headings:text-slate-900 prose-headings:font-black prose-strong:text-slate-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      
      {note.imageUrl && (
        <div className="relative w-full aspect-[16/10] bg-slate-50 group/image border-t border-slate-100">
          <CldImage
            src={note.imageUrl}
            alt="Note attachment"
            fill
            className="object-cover transition-transform duration-500 group-hover/image:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            {onDownloadImage && (
              <button
                onClick={() => onDownloadImage(note.imageUrl!, `note-${note.id}.jpg`)}
                className="px-5 py-2.5 bg-white/90 text-slate-900 rounded-xl hover:bg-white transition-all transform translate-y-4 group-hover/image:translate-y-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider shadow-2xl backdrop-blur-sm"
              >
                <Download size={14} className="text-blue-600" />
                Download Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
