'use client';

import React from 'react';
import { Info } from 'lucide-react';
import SecuritySettings from '@/components/dashboard/SecuritySettings';

export default function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="surface-amber relative overflow-hidden flex items-center gap-4 p-4 rounded-xl border border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 opacity-70" />
        <div className="p-2 bg-primary/10 rounded-lg">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground leading-none">Security Management</h3>
          <p className="text-[11px] font-medium text-muted-foreground mt-1.5">
            Update your authentication credentials and manage session security.
          </p>
        </div>
      </div>

      <div className="surface-neutral rounded-2xl border border-border/80 overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="p-6">
          <SecuritySettings />
        </div>
      </div>
    </div>
  );
}
