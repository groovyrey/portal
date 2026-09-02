'use client';

import Link from 'next/link';
import { ArrowLeft, Home, MessageSquare } from 'lucide-react';
import LottieAnimation from '@/components/ui/LottieAnimation';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Illustration/Icon */}
        <div className="relative mb-8 flex justify-center">
          <LottieAnimation 
            animationPath="/animations/girl-relaxing-error.json"
            className="w-64 h-64"
          />
          <div className="absolute top-0 right-10 bg-card p-2 rounded-md border border-border">
             <span className="text-xs font-medium text-muted-foreground">Err 404</span>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-xl font-bold text-foreground mb-3 tracking-tight">Lost?</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-10">
          We can&apos;t find that page.
        </p>

        {/* Action Buttons */}
        <div className="grid gap-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-3 rounded-lg transition-colors active:opacity-70"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/'))}
              className="flex items-center justify-center gap-2 bg-card border border-border text-muted-foreground font-medium text-sm py-3 rounded-lg hover:bg-accent transition-colors active:opacity-70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go Back
            </button>
            <Link 
              href="/community"
              className="flex items-center justify-center gap-2 bg-card border border-border text-muted-foreground font-medium text-sm py-3 rounded-lg hover:bg-accent transition-colors active:opacity-70"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Help
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-12 text-xs font-medium text-muted-foreground">
          LCC Hub Official Portal
        </p>
      </div>
    </div>
  );
}
