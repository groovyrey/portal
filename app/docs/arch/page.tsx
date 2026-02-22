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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Technical Summary</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            System Architecture
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium">
            A look at the v1.2.0-BETA tech behind LCC Hub—a fast, modern student portal.
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

          {/* How We Store Data */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                How We Store Data
              </h2>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">PostgreSQL (Relational)</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Securely stored using <strong>Amazon Web Services (AWS)</strong>. Stores important info like:
                </p>
                <ul className="text-xs space-y-2 text-slate-600 font-bold">
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Community Posts & Comments</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Post Likes & Poll Votes</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Notifications History</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Student Directory</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-600">Firebase Firestore (NoSQL)</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Used for quick updates and temporary login sessions:
                </p>
                <ul className="text-xs space-y-2 text-slate-600 font-bold">
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Secure Login Sessions</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Saved School Records</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Class Schedules & Financials</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Saved Grade History</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Fast Login System */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600 p-2 rounded-xl">
                  <Workflow className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Fast Login System</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Our <strong>Session Proxy</strong> reuses your existing login info. This skips the slow login process and makes the app load your data up to <strong>90% faster</strong>.
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
                <h3 className="text-lg font-bold">Live Notifications</h3>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">
                Using <strong>Ably Realtime</strong>, the app keeps a fast, live connection for instant updates. Info is sent through two main ways:
              </p>
              <ul className="text-xs space-y-3 font-bold">
                <li className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                  <span className="text-blue-200">Community Feed:</span> community
                </li>
                <li className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                  <span className="text-blue-200">Personal Inbox:</span> student-&#123;userId&#125;
                </li>
              </ul>
            </div>
          </section>

          {/* AI School Helper */}
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0">
                <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                  <Bot size={40} />
                </div>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-xl font-bold">AI School Helper</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  The Portal Assistant uses <strong>Gemini 1.5 Pro</strong>. The AI gets a quick look at your current grades and status to help you better with instant answers.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Smart Context</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Live AI Answers</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Built for Speed</span>
                </div>
              </div>
            </div>
          </section>

          {/* Security Rules */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security Rules
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    Secure Login (No Passwords Saved)
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We never save your passwords. You log in directly to the school's system, and we only save a secure, encrypted session to keep you logged in.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4 text-purple-600" />
                    Secure Session Tokens
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your session is protected by secure browser settings. This stops hackers from stealing your session and ensures your data stays safe.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <h3 className="text-lg font-bold mb-6 relative z-10">Security & Encryption</h3>
                <div className="space-y-4 relative z-10">
                    <div className="font-mono text-[10px] p-4 bg-white/5 rounded-xl border border-white/10 text-emerald-400">
                        <code>
                            ALGORITHM: 'aes-256-cbc'<br/>
                            KEY: crypto.scryptSync(SECRET, 'salt', 32)<br/>
                            IV: crypto.randomBytes(16)
                        </code>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Your data is kept safe with strong encryption. Your info is scrambled differently every time for extra safety.
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
