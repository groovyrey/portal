'use client';

import React from 'react';
import { 
  Info, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Zap, 
  Code2, 
  Heart,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <header className="mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100 shadow-sm mb-6">
            <Sparkles className="h-3 w-3" />
            Project Spotlight
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            LCC Hub <span className="text-blue-600">.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            A modern, community-driven interface designed to streamline student life at La Concepcion College.
          </p>
          <div className="mt-8 flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Version 1.2.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Open Beta</span>
          </div>
        </header>

        <div className="grid gap-12">
          {/* Mission Card */}
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <GraduationCap size={160} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                Our Mission
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg mb-6">
                LCC Hub was born out of a simple need: to make school information more accessible and engaging. We believe that technology should empower students, not frustrate them. By providing a unified dashboard for grades, schedules, and community interaction, we help students focus on what matters most—their education.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">Fast</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Performance</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">Secure</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Encryption</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">Local</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Community</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">Smart</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">AI Driven</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 text-center">Core Capabilities</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Instant Access</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">No more navigating through multiple legacy menus. View your schedule, grades, and financials in one click.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Portal AI</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">An intelligent assistant that knows your academic context and can help answer portal-related questions.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Modern Stack</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Built with Next.js 15, Tailwind CSS, and Firebase for a smooth, app-like experience on any device.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Privacy Focused</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Your data is fetched securely and encrypted during transit. We never store your school password.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">Notice of Unofficial Status</h3>
              <p className="text-slate-400 text-sm max-w-md">
                LCC Hub is an independent third-party application and is not affiliated with, endorsed by, or maintained by La Concepcion College.
              </p>
            </div>
            <Link 
              href="/disclaimer" 
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-md flex items-center gap-2"
            >
              Read Legal Disclaimer
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Development Footer */}
        <footer className="mt-24 pt-12 border-t border-slate-200 flex flex-col items-center gap-6">
          <p className="text-xs text-slate-400 text-center leading-relaxed max-w-xs">
            Contribute to the project or report issues through the community page.
          </p>
        </footer>
      </div>
    </div>
  );
}
