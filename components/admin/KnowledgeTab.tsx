'use client';

import React from 'react';
import { BookOpen, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KnowledgeTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center min-h-[400px] bg-card rounded-2xl border border-border p-12 text-center"
    >
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-full text-amber-500 mb-6">
        <Construction className="h-12 w-12" />
      </div>
      <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Knowledge Base Management</h2>
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest max-w-xs mx-auto">
        This feature is currently under development. Soon you will be able to manage assistant knowledge here.
      </p>
    </motion.div>
  );
}
