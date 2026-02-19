'use client';

import Link from 'next/link';
import { ArrowLeft, Home, MessageSquare } from 'lucide-react';
import LottieAnimation from '@/components/ui/LottieAnimation';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Illustration/Icon */}
        <div className="relative mb-8 flex justify-center">
          <LottieAnimation 
            animationPath="/animations/girl-relaxing-error.json"
            className="w-64 h-64"
          />
          <div className="absolute top-0 right-10 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Err 404</span>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Page Not Found</h1>
        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
          The page you are looking for might have been moved, deleted, or never existed in the first place.
        </p>

        {/* Action Buttons */}
        <div className="grid gap-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-3 w-3" />
              Go Back
            </button>
            <Link 
              href="/community"
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <MessageSquare className="h-3 w-3" />
              Help
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-12 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          LCC Hub Official Portal
        </p>
      </div>
    </div>
  );
}
