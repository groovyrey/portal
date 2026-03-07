import React from 'react';
import { ArrowLeft, BookOpen, Clock, WalletCards, GraduationCap, Mic, BrainCircuit, LayoutGrid, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-xs font-bold mb-10 active:scale-95">
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground uppercase">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
            Master your academic workflow with LCC Hub—the intelligent study companion for modern LCCians.
          </p>
        </header>

        <div className="space-y-16">
          {/* Section: The Desca Workspace */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold tracking-tight uppercase">The Desca Workspace</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed font-medium">
              Desca is your secondary specialized workspace designed for advanced academic tasks and intelligence-gathering.
            </p>

            <div className="grid gap-4">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Cato AI</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Your personalized study buddy. Cato is connected to your academic context, allowing you to ask about your grades, schedules, or complex subjects. Cato can also perform real-time web research and summarize educational content for you.
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">G-Space</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Seamlessly sync with Google Classroom and Tasks. Monitor your assignments, track deadlines, and manage your Google Tasks directly within the Hub interface. 
                </p>
                <div className="mt-4 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">
                    Security Note: If classroom data is missing, re-link your Google account to refresh session tokens.
                  </p>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Meetings & Lectures</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  The digital archive for your classes. Record live sessions, generate high-accuracy transcripts via Deepgram, and let AI synthesize professional insight reports with key takeaways and action items.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Core Portal */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold tracking-tight uppercase">Core Portal</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Academic Registry', icon: GraduationCap, desc: 'View your official grades and automated GPA tracking across all semesters.' },
                { title: 'Class Schedule', icon: Clock, desc: 'A modern, responsive table of your subjects, rooms, and session times.' },
                { title: 'Financial Ledger', icon: WalletCards, desc: 'Real-time monitoring of your assessment of fees, payments, and balance.' },
                { title: 'Subject Catalog', icon: BookOpen, desc: 'Browse available courses, prerequisites, and subject descriptions.' }
              ].map((f, i) => (
                <div key={i} className="bg-card p-5 rounded-lg border border-border shadow-sm flex gap-4">
                  <f.icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold mb-1 text-foreground uppercase tracking-tight">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Security */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-bold tracking-tight uppercase">Security & Privacy</h2>
            </div>

            <div className="bg-slate-900 text-white rounded-lg p-8 shadow-md">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-bold mb-3 uppercase tracking-tight">Intelligence Standard</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                    LCC Hub utilizes AES-256 encryption and secure proxy layers to protect your academic data. We prioritize "Data Sovereignty"—meaning your data belongs to you, and we only process it when you ask.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-3 w-3 text-blue-400" />
                        <h4 className="font-bold text-[10px] uppercase tracking-widest">Zero-Persistence</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Passwords are never stored. We use temporary session tokens for Schoolista synchronization.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-3 w-3 text-blue-400" />
                        <h4 className="font-bold text-[10px] uppercase tracking-widest">Secure Handshake</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">All external integrations (Google, Deepgram) use encrypted server-side API calls.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LCC Hub • Strategic Intelligence
          </p>
          <div className="flex gap-6">
            <Link href="/disclaimer" className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Legal</Link>
            <Link href="/" className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Access</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;
