'use client';

import React from 'react';
import { BookOpen, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KnowledgeTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-card rounded-lg border border-border p-12 text-center space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-full text-amber-500">
        <Construction className="h-10 w-10" />
      </div>
      <div className="max-w-xs mx-auto space-y-2">
        <h2 className="text-lg font-semibold text-foreground uppercase tracking-tight">Knowledge Base</h2>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">
          This feature is currently under development. Soon you will be able to manage assistant knowledge here.
        </p>
      </div>
    </div>
  );
}
