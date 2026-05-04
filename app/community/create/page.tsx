'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info } from 'lucide-react';
import CreatePostCard from '@/components/community/CreatePostCard';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">New Post</h1>
          <p className="text-sm text-muted-foreground">Share your thoughts with the community.</p>
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 flex gap-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold">Guidelines</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Be respectful and helpful. You can use Markdown for formatting and LaTeX for math.
              </p>
            </div>
          </CardContent>
        </Card>

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
