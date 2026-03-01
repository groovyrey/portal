'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';
import { obfuscateId } from '@/lib/utils';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('student_data');
    if (data) {
      const timer = setTimeout(() => setStudentId(JSON.parse(data).id), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 active:scale-95 transition-all w-fit">
              <div className="bg-primary rounded-lg p-1.5 text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-foreground">LCC Hub</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary text-[9px] font-bold text-muted-foreground border border-border uppercase tracking-wider">Beta</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-xs max-w-xs leading-relaxed font-medium">
              A modern student interface designed for accessibility and real-time portal synchronization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/school" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">Academic Info</Link>
              </li>
              <li>
                <Link href="/docs" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">System Docs</Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">Legal Notice</Link>
              </li>
              <li>
                <Link href="/status" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">Service Health</Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">Global Feed</Link>
              </li>
              <li>
                <Link href={studentId ? `/profile/${obfuscateId(studentId)}` : '/profile'} className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">Personal Profile</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center md:text-left">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            &copy; {currentYear} LCC Hub • v{APP_VERSION}
          </p>
        </div>
      </div>
    </footer>
  );
}
