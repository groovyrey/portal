import React from 'react';
import { 
  ArrowLeft, BookOpen, Clock, WalletCards, GraduationCap, 
  BrainCircuit, ShieldCheck, Sparkles, UserCircle, 
  Users, Smartphone, Database, Zap, LayoutGrid 
} from 'lucide-react';
import Link from 'next/link';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-xs font-bold mb-10 active:scale-95">
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
        
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Official Guide</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-foreground uppercase italic">
            LCC Hub Manual
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
            A comprehensive guide to your new intelligent academic ecosystem. Designed to simplify student life at La Consolacion College through AI and automation.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar Navigation for Docs (Visible on Desktop) */}
          <aside className="hidden lg:block space-y-8 sticky top-10 h-fit">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sections</h4>
              <nav className="flex flex-col gap-2">
                {['The Mission', 'AI Assistant', 'Academic Tools', 'Community Hub', 'Security & Sync'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-1">
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div className="p-4 bg-accent/30 rounded-2xl border border-border/50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Pro Tip</h4>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-tight">
                Use the "Ask Assistant" feature for any question about your school records. It's the fastest way to get data.
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-24">
            
            {/* Section: The Mission */}
            <section id="the-mission">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight uppercase italic">The Mission</h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed font-medium mb-6">
                LCC Hub isn't just a portal; it's a <strong>Strategic Intelligence Tool</strong>. We built this to solve the common frustrations of students: scattered schedules, confusing financial records, and lack of real-time connectivity.
              </p>
              <div className="bg-card p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Sparkles size={120} />
                </div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Mobile-First Design
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  The entire platform is built with a responsive design, meaning it works perfectly on your smartphone, tablet, or laptop. No more zooming in on tiny text—the Hub adapts to your device.
                </p>
              </div>
            </section>

            {/* Section: AI Assistant */}
            <section id="ai-assistant">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight uppercase italic">AI Assistant</h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed font-medium mb-8">
                Meet your 24/7 personalized study companion. Unlike generic AI, the Hub Assistant is <strong>context-aware</strong>—it knows who you are and what you're studying.
              </p>
              <div className="space-y-4">
                {[
                  { 
                    title: 'Academic Queries', 
                    icon: BrainCircuit, 
                    desc: 'Ask "What is my GPA?" or "What is my first class tomorrow?" to get instant answers without digging through menus.' 
                  },
                  { 
                    title: 'Dynamic Visualizations', 
                    icon: LayoutGrid, 
                    desc: 'When explaining complex topics, the Assistant can generate 3D molecules, interactive math charts, or custom data tables on the fly.' 
                  },
                  { 
                    title: 'Math & Science Solver', 
                    icon: Zap, 
                    desc: 'Equipped with a Python-powered engine, it can solve advanced calculus, physics problems, and provide step-by-step reasoning.' 
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-card rounded-2xl border border-border/50">
                    <div className="bg-primary/10 p-3 h-fit rounded-xl">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1 uppercase tracking-tight text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Core Tools */}
            <section id="academic-tools">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight uppercase italic">The Core Dashboard</h2>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed font-medium mb-8">
                All your essential LCC data, modernized. We sync with official records to give you a clean, readable view of your progress.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Registry', icon: GraduationCap, title: 'Grade Analytics', desc: 'Track your performance with automated GPA calculations and subject-by-subject breakdown.' },
                  { label: 'Schedule', icon: Clock, title: 'Smart Timetable', desc: 'Never walk into the wrong room. See your subjects, room numbers, and times in a clean weekly view.' },
                  { label: 'Finance', icon: WalletCards, title: 'Real-time Ledger', desc: 'Monitor your tuition balance, payments made, and total assessments without waiting in line.' }
                ].map((item, i) => (
                  <div key={i} className="group p-6 bg-card hover:bg-accent/10 rounded-2xl border border-border transition-all flex items-center gap-6">
                    <div className="bg-background p-4 rounded-2xl group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">{item.label}</span>
                        <h4 className="font-bold text-base text-foreground uppercase tracking-tight italic">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Community */}
            <section id="community-hub">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight uppercase italic">Community Hub</h2>
              </div>
              <div className="bg-foreground text-background p-8 rounded-[2rem] shadow-2xl overflow-hidden relative">
                <div className="absolute -bottom-10 -right-10 opacity-10">
                  <Users size={200} />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase italic">Socially Connected</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">
                  The Hub includes a built-in Community feature where students can post announcements, share resources, and interact. It’s a moderated space designed for academic collaboration.
                </p>
                <div className="flex items-center gap-3 p-4 bg-background/5 rounded-2xl border border-background/10">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Global Student Identity</span>
                </div>
              </div>
            </section>

            {/* Section: Security */}
            <section id="security-&-sync">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight uppercase italic">Security & Data</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold uppercase tracking-tight text-sm mb-1">Data Sovereignty</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        We don't store your passwords. When you log in, we establish a secure, temporary "handshake" with the school's servers to sync your data.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Database className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold uppercase tracking-tight text-sm mb-1">Encrypted Sync</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        All communications between your device and our servers are encrypted using industry-standard AES-256 protocols.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-accent/20 rounded-3xl border border-border/50 flex flex-col justify-center">
                  <h4 className="text-xs font-black uppercase text-primary mb-2 tracking-[0.2em]">How Sync Works</h4>
                  <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-tighter">
                    Login → Portal syncs with official records → Data is parsed into Hub format → Temporary Session created → Safe Exit on Logout.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        <footer className="mt-40 pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg text-white font-black italic">H</div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
              LCC Hub &copy; {new Date().getFullYear()} • Intelligence Redefined
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/disclaimer" className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">Legal & Privacy</Link>
            <Link href="/" className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">Access Portal</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocsPage;