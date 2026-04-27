'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info } from 'lucide-react';
import CreatePostCard from '@/components/community/CreatePostCard';
import { Student } from '@/types';

export default function CreatePostPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Community
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">New Post</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contribute to the LCCians community</p>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Guidelines</h4>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium leading-relaxed">
              Be respectful and follow our community guidelines. Use Markdown for formatting and LaTeX for mathematical expressions.
            </p>
          </div>
        </div>

        <CreatePostCard 
          student={student} 
          onSuccess={() => {
            router.push('/community');
          }} 
        />
      </div>
    </div>
  );
}
