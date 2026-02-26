'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, Download, Trash2, AlertTriangle } from 'lucide-react';
import { SubjectNote, Student } from '@/types';
import { CldImage } from 'next-cloudinary';
import Modal from '@/components/ui/Modal';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isOwner = student?.id === note.userId;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(note.id);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden group">
      <div className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200">
              {note.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">{note.userName}</p>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                  {note.createdAt?.seconds 
                    ? new Date(note.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {isOwner && onDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Delete Note"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {note.content && (
          <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-headings:text-slate-900 prose-headings:font-black prose-strong:text-slate-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl px-1">
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

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="max-w-xs"
      >
        <div className="p-8 text-center">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Delete Note?</h3>
          <p className="text-sm font-medium text-slate-500 mb-8">This action cannot be undone. Are you sure you want to remove this note?</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-6 py-3.5 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
