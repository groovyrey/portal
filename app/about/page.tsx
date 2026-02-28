'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Users, 
  Code2, 
  Star,
  Sparkles,
  ExternalLink,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  Quote
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LottieAnimation from '@/components/ui/LottieAnimation';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AboutPage() {
  const [stats, setStats] = useState({ average: 0, count: 0, recentFeedbacks: [] as any[] });

  useEffect(() => {
    fetch('/api/ratings')
      .then(res => res.json())
      .then(data => {
        if (data.average !== undefined) setStats(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-6">
                <SparkleIcon size={12} />
                <span>Next-Gen Student Hub</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Manage Your <span className="text-blue-600">School Life</span> with Ease.
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg font-medium">
                LCC Hub is a modern student interface designed to keep you connected, informed, and organized throughout your academic journey.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/" 
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                >
                  Launch Hub
                  <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/docs" 
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                  Docs
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden md:flex items-center justify-center"
            >
              <LottieAnimation 
                animationPath="/animations/creative-team.json" 
                className="w-full h-full max-w-sm"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-slate-400' },
              { label: 'Rating', value: stats.average || '0.0', icon: Star, color: 'text-slate-400' },
              { label: 'Community', value: 'Active', icon: Users, color: 'text-slate-400' },
              { label: 'Security', value: 'AES-256', icon: Lock, color: 'text-slate-400' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-base text-slate-500 leading-relaxed font-medium">
              We aim to modernize the student experience by providing tools that are fast, intuitive, and reliable.
            </p>
            
            <div className="space-y-3">
              {[
                { title: 'Modern Interface', desc: 'A cleaner way to access your academic records.' },
                { title: 'Secure & Private', desc: 'Industry-standard encryption for your sensitive data.' },
                { title: 'Community Driven', desc: 'Built for students, with student feedback in mind.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <Quote className="text-slate-700 h-8 w-8 mb-6" />
              <h3 className="text-xl font-bold mb-6 italic leading-relaxed">
                &quot;Education is the passport to the future, for tomorrow belongs to those who prepare for it today.&quot;
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                  MX
                </div>
                <div>
                  <p className="font-bold text-xs">Malcolm X</p>
                  <p className="text-[10px] text-slate-500">Human Rights Activist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">Platform Features</h2>
            <p className="text-slate-500 text-sm font-medium">Tools designed to enhance your productivity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Live Sync', desc: 'Fetch data in real-time straight from the school portal.' },
              { icon: Cpu, title: 'Portal AI', desc: 'Personal school assistant with Web Research & URL Summarization.' },
              { icon: ShieldCheck, title: 'Smart Review', desc: 'AI-monitored community feed for safe discussions.' },
              { icon: MessageSquare, title: 'Community', desc: 'Engage with fellow students about campus life.' },
              { icon: Code2, title: 'Optimized', desc: 'Built for speed and performance on every device.' },
              { icon: Star, title: 'Updates', desc: 'Continuous improvements based on user feedback.' }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-900 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-2xl p-10 md:p-16 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to get started?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/" 
              className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
            >
              Launch Hub
            </Link>
            <Link 
              href="/disclaimer" 
              className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all active:scale-95"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </section>

      <footer className="pt-10 max-w-7xl mx-auto px-6 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          LCC Hub &copy; {new Date().getFullYear()} • Community Project
        </p>
      </footer>
    </div>
  );
}

function SparkleIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
