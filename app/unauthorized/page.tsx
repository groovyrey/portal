import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 relative">
        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
          <Lock className="h-10 w-10 text-red-600" />
        </div>
        <div className="absolute -top-2 -right-2 bg-card p-2 rounded-xl shadow-lg">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
        </div>
      </div>

      <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">Access Restricted</h1>
      <p className="text-muted-foreground max-w-sm mx-auto mb-10 font-medium leading-relaxed">
        This area is reserved for authenticated students. Please log in to view your academic records, schedules, and financial data.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link 
          href="/" 
          className="flex-1 bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:opacity-70 text-sm"
        >
          Sign In Now
        </Link>
        <Link 
          href="/about" 
          className="flex-1 bg-card text-muted-foreground font-bold py-3 px-6 rounded-2xl border border-border hover:bg-accent transition-all text-sm"
        >
          Learn More
        </Link>
      </div>

      <div className="mt-12 pt-12 border-t border-border w-full max-w-md">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Security Protocol Active
        </p>
      </div>
    </div>
  );
}
