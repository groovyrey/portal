import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Unauthorized Access',
  description: 'Access to this area is restricted to authenticated students.',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 relative">
        <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-destructive" />
        </div>
        <div className="absolute -top-2 -right-2 bg-background p-2 rounded-md border shadow-sm">
          <ShieldAlert className="h-6 w-6 text-warning" />
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Access Restricted</h1>
      <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
        This area is reserved for authenticated students. Please sign in to view your records and data.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button asChild className="flex-1 h-12">
            <Link href="/">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-12">
            <Link href="/about">About Hub</Link>
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t w-full max-w-md">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Security Active
        </p>
      </div>
    </div>
  );
}
