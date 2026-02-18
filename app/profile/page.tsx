'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { obfuscateId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('student_data');
    if (saved) {
      const student = JSON.parse(saved);
      if (student?.id) {
        router.replace(`/profile/${obfuscateId(student.id)}`);
      } else {
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
    </div>
  );
}
