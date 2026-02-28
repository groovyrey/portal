'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path === '/assistant') return 'AI Assistant';
    if (path === '/grades') return 'Academic Registry';
    if (path === '/subjects') return 'Class Schedule';
    if (path === '/accounts') return 'Financial Ledger';
    if (path === '/community') return 'Student Feed';
    if (path.startsWith('/profile')) return 'Student Profile';
    if (path === '/settings') return 'Preferences';
    if (path === '/eaf') return 'Assessment Form';
    if (path === '/about') return 'About Hub';
    if (path === '/disclaimer') return 'Legal Notice';
    if (path === '/status') return 'Service Health';
    if (path === '/docs') return 'Documentation';
    if (path === '/school') return 'School Information';
    if (path.startsWith('/post')) return 'Post Details';
    return '';
  };

  const title = getPageTitle(pathname);

  // Don't show header on main dashboard (it has its own header)
  if (pathname === '/' || !title) return null;

  return (
    <div className="bg-background/80 border-b border-border sticky top-16 z-[90] backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.button
            key="back-button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => router.back()}
            className="p-1.5 hover:bg-accent rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
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
