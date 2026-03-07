'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  Star, 
  Target, 
  Heart, 
  Quote, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Monitor,
  Mic,
  BrainCircuit,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Marquee from '@/components/shared/Marquee';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">{question}</span>
        <div className={`p-1 rounded-full bg-accent transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary text-primary-foreground' : ''}`}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm text-muted-foreground leading-relaxed font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AboutPage() {
  const [stats, setStats] = useState({ count: 0, average: '0.0' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/ratings');
        const data = await res.json();
        if (data.average !== undefined) {
          setStats({
            count: data.count || 0,
            average: data.average.toFixed(1) || '0.0'
          });
        }
      } catch (e) {}
    };
    fetchStats();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const workspaceFeatures = [
    { title: 'Cato AI', desc: 'Context-aware study buddy.', icon: BrainCircuit },
    { title: 'G-Space', icon: LayoutGrid, desc: 'Google Sync & Tasks.' },
    { title: 'Meetings', icon: Mic, desc: 'Smart Class Archives.' },
    { title: 'Archive', icon: Monitor, desc: 'Central study library.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden pb-20 font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider mb-6">
              Strategic Academic Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6 uppercase tracking-tight italic">
              Empowering <span className="text-primary">LCCians</span> with Desca.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg font-medium mx-auto lg:mx-0">
              LCC Hub is a specialized academic workspace designed to streamline your school life with AI integration and real-time connectivity.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link 
                href="/" 
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                Access Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/docs" 
                className="px-8 py-4 bg-card border border-border text-foreground rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
              >
                Documentation
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative lg:h-[500px] bg-muted/30 rounded-lg border border-border p-8 flex items-center justify-center overflow-hidden shadow-inner"
          >
             <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                {workspaceFeatures.map((f, i) => (
                    <div key={i} className="p-6 bg-card rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all">
                        <f.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="font-black text-sm mb-1 uppercase tracking-tight italic">{f.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{f.desc}</p>
                    </div>
                ))}
             </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-primary' },
              { label: 'Avg Rating', value: stats.average || '0.0', icon: Star, color: 'text-amber-500' },
              { label: 'Network', value: 'Global', icon: Users, color: 'text-blue-500' },
              { label: 'Encryption', value: 'AES-256', icon: ShieldCheck, color: 'text-emerald-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <stat.icon className={`h-5 w-5 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-2xl font-black text-foreground mb-1 uppercase italic tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 italic">Core Objectives</h2>
            <h2 className="text-3xl font-black text-foreground mb-8 uppercase tracking-tight">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-10">
              To eliminate the complexity of academic administration. By providing an intelligent, unified workspace, we empower students to prioritize learning and personal advancement.
            </p>
            <div className="space-y-4">
              {[
                { title: 'Intelligence-First', desc: 'AI-driven insights for study management.' },
                { title: 'Data Sovereignty', desc: 'Secure, student-owned academic records.' },
                { title: 'Operational Speed', desc: 'Optimized for low-latency synchronization.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-lg bg-muted/20 border border-border">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <h4 className="font-black text-foreground text-[11px] uppercase tracking-wider">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-900 dark:bg-card border border-border rounded-lg p-10 text-white dark:text-foreground relative overflow-hidden shadow-2xl">
              <Quote className="text-primary h-8 w-8 mb-8 opacity-50" />
              <p className="text-lg font-bold leading-relaxed mb-10 relative z-10 italic">
                "The greatness of a man is not in how much wealth he acquires, but in his integrity and his ability to affect those around him positively."
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-black text-[10px] text-white">
                  BM
                </div>
                <div>
                  <h5 className="text-sm font-black uppercase tracking-tight">Bob Marley</h5>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Activist</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-lg border border-dashed border-border flex items-center gap-4 group">
               <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Heart className="h-5 w-5" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Community Initiative</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Maintained by student contributions.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/10 border-y border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground italic">Intelligence Base</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">Frequently Asked Questions</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:px-10 md:py-6 shadow-sm">
            <FAQItem 
              question="How does synchronization work?" 
              answer="LCC Hub uses a secure server-side proxy to interface with official school systems. It maps your data into our optimized workspace in real-time without storing your primary login credentials." 
            />
            <FAQItem 
              question="Is my academic data secure?" 
              answer="Security is our baseline. We utilize AES-256 encryption and strictly ephemeral session management. Your schoolista password is never persisted on our database." 
            />
            <FAQItem 
              question="What is the purpose of Cato?" 
              answer="Cato is your context-aware research assistant. It can analyze your specific course load, summarize lectures, and perform educational web searches tailored to your curriculum." 
            />
            <FAQItem 
              question="Can I use Hub during classes?" 
              answer="Yes. Our 'Meetings' feature is specifically designed for classroom use, enabling you to capture lectures and generate study reports on the fly." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="bg-primary rounded-lg p-10 md:p-20 text-primary-foreground text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 italic leading-none">Access Strategic Intelligence.</h2>
            <p className="text-primary-foreground/70 mb-12 max-w-md mx-auto font-black uppercase text-[10px] tracking-[0.2em]">
              Join the new standard of LCCian study workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/" 
                className="px-10 py-4 bg-white text-slate-900 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl"
              >
                Engage Portal
              </Link>
              <Link 
                href="/docs" 
                className="px-10 py-4 bg-white/10 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 border border-white/20"
              >
                Documentation
              </Link>
            </div>
          </div>
          {/* Subtle background graphic */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />
        </div>
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] text-center mt-12">
          &copy; {new Date().getFullYear()} LCC Hub • Strategic Intelligence Standard
        </p>
      </section>
    </div>
  );
}
