'use client';

import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      theme="system"
      expand={true}
      closeButton={true}
      visibleToasts={5}
      toastOptions={{
        className: 'group toast bg-card/80 backdrop-blur-xl border border-border/50 text-foreground rounded-3xl shadow-2xl p-4 flex items-center gap-5',
        classNames: {
          title: 'font-bold text-[13px] tracking-tight leading-none mb-1.5',
          description: 'text-[11px] text-muted-foreground font-semibold leading-normal',
          actionButton: 'bg-primary text-primary-foreground font-bold rounded-xl text-[10px] uppercase tracking-wider',
          cancelButton: 'bg-muted text-muted-foreground font-bold rounded-xl text-[10px] uppercase tracking-wider',
        },
        style: {
          fontFamily: 'var(--font-sans)',
        }
      }}
      icons={{
        success: <div className="mr-1 text-emerald-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>,
        error: <div className="mr-1 text-rose-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>,
        info: <div className="mr-1 text-blue-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>,
        warning: <div className="mr-1 text-amber-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>,
        loading: <div className="mr-1 text-primary animate-spin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg></div>
      }}
    />
  );
}
