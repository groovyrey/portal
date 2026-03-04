'use client';

import React from 'react';
import { Info } from 'lucide-react';
import SecuritySettings from '@/components/dashboard/SecuritySettings';

export default function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl border border-border shadow-sm">
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

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-6">
          <SecuritySettings />
        </div>
      </div>
    </div>
  );
}
