'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from './ThemeProvider';

export default function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="top-center"
      theme={(resolvedTheme as 'light' | 'dark' | 'system') || 'system'}
      expand={false}
      closeButton={false}
      visibleToasts={3}
      toastOptions={{
        className: 'group toast !bg-background !border-border !text-foreground rounded-md shadow-lg border px-5 py-4 flex items-center gap-4 w-[min(calc(100vw-2rem),380px)]',
        classNames: {
          title: 'font-semibold text-[14px] leading-tight text-foreground',
          description: 'text-[12px] text-muted-foreground leading-normal mt-0.5',
          actionButton: 'bg-primary text-primary-foreground font-medium rounded-sm text-xs px-3 py-1.5 transition-opacity hover:opacity-90',
          cancelButton: 'bg-muted text-muted-foreground font-medium rounded-sm text-xs px-3 py-1.5 transition-colors hover:bg-muted/80',
        },
        style: {
          fontFamily: 'var(--font-sans)',
        }
      }}
      icons={{
        success: <div className="text-blue-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>,
        error: <div className="text-rose-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>,
        info: <div className="text-blue-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>,
        warning: <div className="text-amber-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>,
        loading: <div className="text-primary animate-spin"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg></div>
      }}
    />
  );
}
