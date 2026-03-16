'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  Star, 
  Heart, 
  Quote, 
  ChevronRight, 
  ArrowRight,
  Mic,
  BrainCircuit,
  LayoutGrid,
  Calendar,
  Wallet,
  Globe
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
        <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{question}</span>
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
    { title: 'Academic Portal', desc: 'Live grades & schedules.', icon: LayoutGrid },
    { title: 'Assistant AI', desc: 'Context-aware study buddy.', icon: BrainCircuit },
    { title: 'Meetings', icon: Mic, desc: 'Smart Class Archives.' },
    { title: 'Financials', icon: ShieldCheck, desc: 'Track fees and balances.' },
  ];

  const marqueeItems = [
    { description: 'Grades', icon: Star },
    { description: 'Schedules', icon: Calendar },
    { description: 'Financials', icon: Wallet },
    { description: 'Assistant AI', icon: BrainCircuit },
    { description: 'Meetings', icon: Mic },
    { description: 'LCCians', icon: Users },
    { description: 'Community', icon: Globe },
    { description: 'Privacy', icon: ShieldCheck },
    { description: 'Sync', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden pb-20 font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-tight mb-6">
              The Ultimate Student Portal
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight italic">
              Your Campus Life, <span className="text-primary">Simplified.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg font-medium mx-auto lg:mx-0">
              LCC Hub is a student-first academic workspace designed to streamline your daily school life at La Concepcion College with real-time connectivity and intelligent tools.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link 
                href="/" 
                className="px-8 py-4 bg-foreground text-background rounded-lg font-bold text-[10px] tracking-tight flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                Launch Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/docs" 
                className="px-8 py-4 bg-card border border-border text-foreground rounded-lg font-bold text-[10px] tracking-tight hover:bg-accent transition-all active:scale-95"
              >
                View Features
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
                        <h4 className="font-bold text-sm mb-1 tracking-tight italic">{f.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{f.desc}</p>
                    </div>
                ))}
             </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="border-y border-border py-8 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px] dark:bg-grid-slate-400/[0.05]" />
        <Marquee subjects={marqueeItems} />
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-primary' },
              { label: 'Avg Rating', value: stats.average || '0.0', icon: Star, color: 'text-amber-500' },
              { label: 'LCCians', value: 'Community', icon: Users, color: 'text-primary' },
              { label: 'Security', value: 'AES-256', icon: ShieldCheck, color: 'text-primary' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <stat.icon className={`h-5 w-5 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-2xl font-bold text-foreground mb-1 tracking-tighter italic">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground tracking-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-xs font-bold text-primary tracking-tight mb-4 italic">Core Values</h2>
            <h2 className="text-3xl font-bold text-foreground mb-8 tracking-tight">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-10">
              To transform the LCC student experience by providing a modern, efficient, and mobile-friendly interface for academic management. We believe technology should serve students, not complicate their journey.
            </p>
            <div className="space-y-4">
              {[
                { title: 'Student-Centric', desc: 'Designed specifically for the needs of LCCians.' },
                { title: 'Privacy First', desc: 'Your school credentials are never stored on our servers.' },
                { title: 'Seamless Access', desc: 'Instant access to grades, schedules, and accounts.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-lg bg-muted/20 border border-border">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground text-[11px] tracking-tight">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-foreground text-background dark:bg-card dark:text-foreground border border-border rounded-lg p-10 relative overflow-hidden shadow-2xl">
              <Quote className="text-primary h-8 w-8 mb-8 opacity-50" />
              <p className="text-lg font-bold leading-relaxed mb-10 relative z-10 italic">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-bold text-[10px] text-primary-foreground">
                  NM
                </div>
                <div>
                  <h5 className="text-sm font-bold tracking-tight">Nelson Mandela</h5>
                  <p className="text-[10px] text-muted-foreground tracking-tight font-bold">Global Leader</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-lg border border-dashed border-border flex items-center gap-4 group">
               <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Heart className="h-5 w-5" />
               </div>
               <div>
                  <h4 className="text-[11px] font-bold tracking-tight text-foreground">Community Driven</h4>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-tight">Built by students, for students.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/10 border-y border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground italic">Common Questions</h2>
            <p className="text-[10px] font-bold text-muted-foreground tracking-tight mt-2">Everything you need to know</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:px-10 md:py-6 shadow-sm">
            <FAQItem 
              question="How does LCC Hub work?" 
              answer="LCC Hub acts as a specialized interface for the official school portal. It securely fetches your data (grades, schedule, financials) and displays it in a modern, mobile-responsive workspace." 
            />
            <FAQItem 
              question="Is my portal account safe?" 
              answer="Absolutely. We use industry-standard encryption and strictly ephemeral session management. Your schoolista password is used only to authenticate with the official portal and is never saved in our database." 
            />
            <FAQItem 
              question="Who created LCC Hub?" 
              answer="LCC Hub is an independent project created by students who wanted a better way to access school information. It is not an official school publication but is built specifically for the LCC community." 
            />
            <FAQItem 
              question="Is there an official app?" 
              answer="LCC Hub is designed to work like an app on your phone. You can 'Add to Home Screen' from your mobile browser for a full-screen, app-like experience." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="bg-primary rounded-lg p-10 md:p-20 text-primary-foreground text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 italic leading-none">Experience the Hub.</h2>
            <p className="text-primary-foreground/70 mb-12 max-w-md mx-auto font-bold text-[10px] tracking-tight">
              Join the growing community of LCCians using the Hub.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/" 
                className="px-10 py-4 bg-background text-foreground rounded-lg font-bold text-[10px] tracking-tight transition-all active:scale-95 shadow-xl"
              >
                Access Hub
              </Link>
              <Link 
                href="/docs" 
                className="px-10 py-4 bg-primary-foreground/10 text-primary-foreground rounded-lg font-bold text-[10px] tracking-tight hover:bg-primary-foreground/20 transition-all active:scale-95 border border-primary-foreground/20"
              >
                Read Docs
              </Link>
            </div>
          </div>
          {/* Subtle background graphic */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-foreground/10 to-transparent pointer-events-none" />
        </div>
        <p className="text-[9px] text-muted-foreground font-bold tracking-tight text-center mt-12">
          &copy; {new Date().getFullYear()} LCC Hub • Built for the LCC Community
        </p>
      </section>
    </div>
  );
}
