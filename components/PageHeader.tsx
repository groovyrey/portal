'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const pageTitles: { [key: string]: string } = {
  '/settings': 'Settings',
  '/eaf': 'Enrollment Assessment Form',
  '/grades': 'Academic Reports',
  '/accounts': 'Student Accounts',
  '/offered-subjects': 'Offered Subjects',
};

export default function PageHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show header on home page or if pathname is not in titles
  if (pathname === '/' || !pageTitles[pathname]) {
    return null;
  }

  const title = pageTitles[pathname];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-[90]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>
    </div>
  );
}
