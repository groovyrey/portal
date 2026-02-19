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
  ArrowLeft,
  Bot,
  BellRing
} from 'lucide-react';
import Link from 'next/link';

export default function ArchDocsPage() {
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
            An in-depth look at the v1.2.0-BETA engineering behind LCC Hub—a high-performance, hybrid-cloud student portal.
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
              <TechCard icon={<Zap className="text-blue-500" />} name="Next.js 16" desc="App Router & SSR" />
              <TechCard icon={<Database className="text-blue-600" />} name="PostgreSQL" desc="AWS RDS / OIDC" />
              <TechCard icon={<Database className="text-orange-500" />} name="Firestore" desc="NoSQL / Sessions" />
              <TechCard icon={<Workflow className="text-purple-500" />} name="Ably" desc="Real-time Pub/Sub" />
              <TechCard icon={<Bot className="text-indigo-500" />} name="Gemini AI" desc="LLM / Inference" />
              <TechCard icon={<Cpu className="text-slate-600" />} name="Cheerio" desc="Scraping Engine" />
              <TechCard icon={<ShieldCheck className="text-emerald-500" />} name="AES-256-CBC" desc="Encryption" />
              <TechCard icon={<Globe className="text-cyan-500" />} name="Tailwind 4" desc="CSS Utility Engine" />
            </div>
          </section>

          {/* Hybrid Database Layer */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                Hybrid Database Architecture
              </h2>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">PostgreSQL (Relational)</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Managed via <strong>AWS RDS</strong> with OIDC-based IAM authentication. Stores high-integrity, relational data:
                </p>
                <ul className="text-xs space-y-2 text-slate-600 font-bold">
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Community Posts & Comments</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Post Likes & Poll Votes</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Persistent Notification Logs</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Verified Student Directory</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-600">Firebase Firestore (NoSQL)</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Used for document-based, high-frequency synchronization and transient session storage:
                </p>
                <ul className="text-xs space-y-2 text-slate-600 font-bold">
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Encrypted Portal Session Jars</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Scraped Academic Records</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Class Schedules & Financials</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Grade Ledger Cache</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Real-time Infrastructure */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600 p-2 rounded-xl">
                  <Workflow className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Ghost Session Proxy</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Our proprietary <strong>Session Proxy</strong> rehydrates legacy portal cookies from encrypted Firestore records. This bypasses the expensive login handshake, reducing subsequent scrape times by up to <strong>90%</strong>.
              </p>
              <div className="font-mono text-[10px] p-4 bg-white/5 rounded-xl border border-white/10 text-purple-300">
                <code>
                  const jar = CookieJar.fromJSON(decrypted);<br/>
                  const client = wrapper(axios.create(&#123; jar &#125;));<br/>
                  // Direct access to Main.aspx
                </code>
              </div>
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2 rounded-xl">
                  <BellRing className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Real-time Pub/Sub</h3>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">
                Powered by <strong>Ably Realtime</strong>, the portal maintains a WebSocket connection for instant interactivity. Notifications and community updates are pushed across two primary channel patterns:
              </p>
              <ul className="text-xs space-y-3 font-bold">
                <li className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                  <span className="text-blue-200">Global:</span> community
                </li>
                <li className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                  <span className="text-blue-200">Private:</span> notifications:&#123;userId&#125;
                </li>
              </ul>
            </div>
          </section>

          {/* AI Intelligence Layer */}
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0">
                <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                  <Bot size={40} />
                </div>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-xl font-bold">AI Intelligence Layer</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  The Portal Assistant utilizes <strong>Gemini 1.5 Pro</strong> (or Gemma 3) with a dynamically injected context window. Each inference call is primed with a comprehensive student snapshot including current GPA, full grade ledger, and up-to-the-minute financial status.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Context Injected</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Streamed Inference</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Edge Optimized</span>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Encryption */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security Protocol
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Zero-Persistence Auth
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Raw passwords never touch our database. Authentication is performed directly against the school's legacy backend, and only an encrypted session jar is persisted in Firestore using <strong>AES-256-CBC</strong>.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4 text-purple-600" />
                    HttpOnly Tokenization
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Client sessions are managed via <strong>HttpOnly, Secure, SameSite=Lax</strong> cookies. This prevents XSS-based session hijacking and ensures tokens are only transmitted over HTTPS.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <h3 className="text-lg font-bold mb-6 relative z-10">Encryption Standard</h3>
                <div className="space-y-4 relative z-10">
                    <div className="font-mono text-[10px] p-4 bg-white/5 rounded-xl border border-white/10 text-emerald-400">
                        <code>
                            ALGORITHM: 'aes-256-cbc'<br/>
                            KEY: crypto.scryptSync(SECRET, 'salt', 32)<br/>
                            IV: crypto.randomBytes(16)
                        </code>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Data integrity is guaranteed through unique IV salts for every encryption operation, ensuring that identical inputs result in non-repeating ciphertexts.
                    </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-12 border-t border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            End of Documentation — V1.2.0-BETA
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
