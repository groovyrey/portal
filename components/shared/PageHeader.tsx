'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path === '/assistant') return 'Assistant';
    if (path === '/g-space') return 'G-Space';
    if (path === '/grades') return 'Grades';
    if (path === '/grades/report') return 'Grade Record';
    if (path === '/subjects') return 'Schedule';
    if (path === '/accounts') return 'Accounts';
    if (path === '/community') return 'Community';
    if (path.startsWith('/student/')) return 'Profile';
    if (path === '/eaf') return 'EAF';
    if (path === '/about') return 'About';
    if (path === '/disclaimer') return 'Disclaimer';
    if (path === '/docs') return 'Docs';
    if (path === '/school') return 'School';
    if (path === '/admin') return 'Admin';
    if (path === '/admin/test') return 'Admin Test';
    if (path.startsWith('/post/')) return 'Post';
    return '';
  };

  const title = getPageTitle(pathname);

  // Don't show header on main dashboard (it has its own header)
  if (pathname === '/' || !title) return null;

  return (
    <div className="bg-background/95 border-b border-border sticky top-16 z-[90] backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.button
            key="back-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => router.back()}
            className="p-1.5 hover:bg-accent rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-1 w-1 rounded-full bg-blue-500" />
            <h1 className="text-sm font-bold text-foreground tracking-tight">{title}</h1>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
