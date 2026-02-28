'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  Star, 
  Target, 
  Heart, 
  Globe, 
  Award, 
  Lock,
  Calendar,
  MessageCircle,
  Code2,
  CheckCircle2,
  Quote,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const [stats, setStats] = useState({ count: 0, average: '0.0' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/ratings');
        const data = await res.json();
        if (data.success) {
          setStats({
            count: data.totalRatings,
            average: data.averageRating
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

  const features = [
    { title: 'Real-time Sync', desc: 'Instant access to your official school records from Schoolista.', icon: Zap },
    { title: 'AI Assistant', desc: 'An intelligent academic companion that understands your course context.', icon: Sparkles },
    { title: 'Student Feed', desc: 'A dedicated space for LCCians to share, poll, and connect.', icon: MessageCircle },
    { title: 'Bank-grade Security', desc: 'Your data is encrypted and never stored on unauthorized servers.', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3 w-3 text-blue-500" />
              The Future of LCC Portal
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Empowering Every <span className="text-blue-500 italic">LCCian</span> with Intelligence.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg font-medium">
              LCC Hub is more than just a portal—it's your ultimate academic companion, designed to streamline your school life with modern tools and real-time connectivity.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                Access Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/docs" 
                className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-bold hover:bg-accent transition-all active:scale-95"
              >
                Read Documentation
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative lg:h-[500px] bg-accent/30 rounded-3xl border border-border p-8 flex items-center justify-center overflow-hidden"
          >
             <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                {features.map((f, i) => (
                    <div key={i} className="p-6 bg-card rounded-2xl border border-border shadow-sm">
                        <f.icon className="h-8 w-8 text-blue-500 mb-4" />
                        <h4 className="font-bold text-sm mb-1">{f.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{f.desc}</p>
                    </div>
                ))}
             </div>
             {/* Decorative element */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-border bg-accent/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-blue-500' },
              { label: 'Rating', value: stats.average || '0.0', icon: Star, color: 'text-amber-500' },
              { label: 'Community', value: 'Active', icon: Users, color: 'text-emerald-500' },
              { label: 'Security', value: 'AES-256', icon: Lock, color: 'text-indigo-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <stat.icon className={`h-5 w-5 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-base text-muted-foreground leading-relaxed font-medium mb-8">
              We aim to eliminate the friction between students and their academic data. By providing a clean, fast, and intelligent interface, we empower students to focus on what truly matters: learning and personal growth.
            </p>
            <div className="space-y-4">
              {[
                { title: 'User-Centric Design', desc: 'Built by students, for students.' },
                { title: 'Data Sovereignty', desc: 'Your data, your access, always.' },
                { title: 'Community Growth', desc: 'Fostering a safer digital campus.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-accent border border-border transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-primary rounded-2xl p-8 md:p-10 text-primary-foreground relative overflow-hidden shadow-xl">
              <Quote className="text-primary-foreground/20 h-8 w-8 mb-6" />
              <p className="text-lg font-medium leading-relaxed mb-8 relative z-10 italic">
                "The greatness of a man is not in how much wealth he acquires, but in his integrity and his ability to affect those around him positively."
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-[10px]">
                  BM
                </div>
                <div>
                  <h5 className="text-sm font-bold">Bob Marley</h5>
                  <p className="text-[10px] text-primary-foreground/60">Human Rights Activist</p>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-card/5 rounded-full" />
            </div>
            
            <div className="mt-8 p-6 rounded-2xl border border-dashed border-border flex items-center gap-4 group hover:border-blue-500 transition-colors cursor-help">
               <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-foreground">Community Funded</h4>
                  <p className="text-xs text-muted-foreground font-medium">LCC Hub is maintained by student contributions.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-accent/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Platform Features</h2>
            <p className="text-muted-foreground text-sm font-medium">Tools designed to enhance your productivity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Ledger View', desc: 'Easily track your balance, payments, and assessment history.', icon: Award },
              { title: 'Schedule Table', desc: 'A beautiful, responsive class schedule available offline.', icon: Calendar },
              { title: 'Community Feed', desc: 'Connect with other students and share your thoughts.', icon: Users },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-muted-foreground transition-all shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-accent text-foreground flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="bg-primary rounded-2xl p-10 md:p-16 text-primary-foreground text-center">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6">Ready to upgrade your experience?</h2>
          <p className="text-primary-foreground/70 mb-10 max-w-md mx-auto font-medium">
            Join thousands of students who have already moved to the modern hub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/" 
              className="px-8 py-3 bg-card text-foreground rounded-xl font-bold transition-all active:scale-95 shadow-sm hover:bg-accent"
            >
              Get Started Now
            </Link>
            <Link 
              href="/docs" 
              className="px-8 py-3 bg-primary-foreground/10 text-primary-foreground rounded-xl font-bold hover:bg-primary-foreground/20 transition-all active:scale-95"
            >
              Learn More
            </Link>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center mt-12">
          &copy; {new Date().getFullYear()} LCC Hub • Designed with pride in the Philippines
        </p>
      </section>
    </div>
  );
}
