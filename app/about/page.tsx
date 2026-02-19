'use client';

import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  Star
} from 'lucide-react';
import Link from 'next/link';
import LottieAnimation from '@/components/ui/LottieAnimation';

export default function AboutPage() {
  const [stats, setStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    fetch('/api/ratings')
      .then(res => res.json())
      .then(data => {
        if (data.average !== undefined) setStats(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Instant Access</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">View your schedule, grades, and financials in one click without legacy menus.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Portal AI</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Your personal academic assistant that helps answer questions about your school data.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Aegis</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Advanced moderation that ensures community safety and professional student conduct.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Topic-Based Feed</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Organized discussions across Academics, Career, Well-being, and Campus Life.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Modern Stack</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Built with Next.js 15 and Tailwind CSS for a high-performance, app-like experience.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">User Satisfaction</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{stats.average || '0.0'}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-3 w-3 ${s <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">({stats.count})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Architecture Section */}
          <div className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Cpu size={160} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Code2 className="h-6 w-6 text-blue-400" />
                System Architecture
              </h2>
              <div className="grid md:grid-cols-2 gap-12 text-slate-300">
                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-400" />
                    Real-time Data Sync
                  </h4>
                  <p className="text-sm leading-relaxed">
                    LCC Hub acts as a highly optimized <strong>Headless Browser Wrapper</strong>. Instead of maintaining a separate copy of school records, we programmatically fetch and sync your real-time data directly from the official portal on demand.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    AES-256 Security
                  </h4>
                  <p className="text-sm leading-relaxed">
                    Security is baked into our core. We utilize <strong>AES-256 bit encryption</strong> for all session tokens. Your portal credentials are never permanently stored; they exist only within your local, encrypted session.
                  </p>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Project Status</p>
                  <p className="text-sm font-medium">Independent Community Project (Not affiliated with LCC)</p>
                </div>
                <Link 
                  href="/disclaimer" 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  View Full Disclaimer
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
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
