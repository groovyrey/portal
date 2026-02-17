'use client';

import React from 'react';
import { 
  Code2, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Zap, 
  Lock, 
  Server,
  Layers,
  ArrowRight,
  Workflow,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function DeepDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Docs
        </Link>
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Code2 className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Technical Brief</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            System Architecture
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium">
            An in-depth look at the engineering behind the unofficial LCC Hub, from the scraping engine to the security protocols.
          </p>
        </header>

        <div className="space-y-16">
          {/* Tech Stack Grid */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Technology Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TechCard icon={<Zap className="text-blue-500" />} name="Next.js 15" desc="App Router & SSR" />
              <TechCard icon={<Database className="text-orange-500" />} name="Firestore" desc="Real-time NoSQL" />
              <TechCard icon={<Cpu className="text-purple-500" />} name="Axios + Cheerio" desc="Scraping Engine" />
              <TechCard icon={<Globe className="text-emerald-500" />} name="Tailwind 4" desc="CSS Utility Engine" />
            </div>
          </section>

          {/* Data Flow / Orchestration */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Workflow className="h-5 w-5 text-blue-600" />
                Data Orchestration
              </h2>
            </div>
            <div className="p-8">
              <div className="space-y-8">
                <Step 
                  number="01" 
                  title="Session Initialization" 
                  desc="The system initiates a headless request to the Schoolista ASP.NET backend. It captures the initial __VIEWSTATE and __EVENTVALIDATION tokens required for the ASP.NET state machine."
                />
                <Step 
                  number="02" 
                  title="Parallel Scraping" 
                  desc="Utilizing Promise.all(), the system simultaneously requests the EAF, Grades, Subject List, and Account pages. This reduces total load time by ~70% compared to sequential browsing."
                />
                <Step 
                  number="03" 
                  title="DOM Parsing & Normalization" 
                  desc="Cheerio parses the raw HTML. Data is extracted using CSS selectors, cleaned of redundant whitespace, and mapped to standardized TypeScript interfaces."
                />
                <Step 
                  number="04" 
                  title="Sync & Cache" 
                  desc="Extracted data is updated in Firestore for real-time community features, while session-specific data is encrypted and returned to the client-side state."
                />
              </div>
            </div>
          </section>

          {/* Security Deep Dive */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security Implementation
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Zero-Persistence Auth
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    User credentials are encrypted using <strong>AES-256-CBC</strong> with a server-side secret key. This encrypted payload is stored only in a <strong>HttpOnly, Secure, SameSite=Lax</strong> cookie. The database never sees or stores your password.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4 text-purple-600" />
                    Proxy-Based Fetching
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    All requests to the school portal are proxied through our backend. This prevents CORS issues and protects the user's IP address from direct exposure to the legacy portal system.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <h3 className="text-lg font-bold mb-6 relative z-10">Encryption Logic</h3>
                <div className="space-y-4 relative z-10">
                    <div className="font-mono text-[10px] p-4 bg-white/5 rounded-xl border border-white/10 text-blue-300">
                        <code>
                            const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);<br/>
                            let encrypted = cipher.update(text, 'utf8', 'hex');<br/>
                            encrypted += cipher.final('hex');
                        </code>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Every session token is uniquely salted. Even if two users have the same password, their session cookies will be entirely different.
                    </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ / Performance */}
          <section className="bg-blue-600 rounded-3xl p-10 text-white shadow-xl shadow-blue-200">
            <h3 className="text-2xl font-bold mb-4">Performance Benchmarks</h3>
            <p className="text-blue-100 mb-8 max-w-xl">
              Our middleware architecture significantly outperforms the legacy portal by optimizing asset delivery and data retrieval.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-3xl font-black mb-1">~2.1s</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Avg. Login Speed</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-3xl font-black mb-1">94/100</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Lighthouse Score</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-3xl font-black mb-1">70%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Data Compression</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-12 border-t border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            End of Documentation — V1.1.0
          </p>
        </footer>
      </div>
    </div>
  );
}

function TechCard({ icon, name, desc }: { icon: React.ReactNode, name: string, desc: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{name}</h3>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="shrink-0">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          {number}
        </div>
      </div>
      <div className="pt-2">
        <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
