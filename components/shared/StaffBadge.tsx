'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-blue-500/10 p-0.5 text-blue-600 dark:text-blue-400",
        className
      )}
      title="Staff"
    >
      <ShieldCheck className="h-3 w-3" />
    </span>
  );
}
