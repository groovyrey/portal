'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Users, 
  Code2, 
  Star,
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles size={14} />
                <span>Next-Gen Student Portal</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-6">
                A Better Way to Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">School Life.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                LCC Hub is more than just a dashboard. It's a modern, AI-powered tool built to make your academic life easier and keep you connected.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/" 
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:opacity-70"
                >
                  Get Started
                  <ArrowRight size={18} />
                </Link>
                <Link 
                  href="/docs" 
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all active:opacity-70"
                >
                  Documentation
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-square flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl animate-pulse" />
              <LottieAnimation 
                animationPath="/animations/creative-team.json" 
                className="w-full h-full max-w-md relative z-10"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-amber-500' },
              { label: 'Rating', value: stats.average || '0.0', icon: Star, color: 'text-blue-600' },
              { label: 'Community', value: 'Active', icon: Users, color: 'text-indigo-600' },
              { label: 'Security', value: 'AES-256', icon: Lock, color: 'text-emerald-600' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="w-12 h-1 px-0 bg-blue-600 inline-block" />
                Our Goal
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                We're here to make school tools better. LCC Hub was made because students deserve tools that are as fast as they are. We've combined easy access to your data with helpful community features to create the best student companion.
              </p>
            </div>
            
            <div className="grid gap-4">
              {[
                { title: 'Simple & Fast', desc: 'A modern interface for the portal. Just the info you need, right away.' },
                { title: 'Privacy First', desc: 'Your data is yours. We use strong encryption to keep everything safe.' },
                { title: 'Made by Students', desc: 'Built by students who know how hard it can be to use the school portal.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Quote size={200} />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-8">
                  <GraduationCap className="text-white h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-6 italic leading-relaxed">
                  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs">
                    MX
                  </div>
                  <div>
                    <p className="font-bold text-sm">Malcolm X</p>
                    <p className="text-xs text-slate-500">Human Rights Activist</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Modernized */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Cool Features</h2>
            <p className="text-slate-400">Everything you need to keep up with your school work, built with the best tools.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Zap, 
                title: 'Live Sync', 
                desc: 'LCC Hub fetches your data in real-time straight from the official school portal.',
                color: 'blue'
              },
              { 
                icon: Cpu, 
                title: 'Portal AI', 
                desc: 'Your personal school helper. Ask about your grades, schedule, or school info.',
                color: 'indigo'
              },
              { 
                icon: ShieldCheck, 
                title: 'Smart Reviewer', 
                desc: 'Our AI reviews community posts to keep things friendly and helpful for everyone.',
                color: 'emerald'
              },
              { 
                icon: MessageSquare, 
                title: 'Chat Feed', 
                desc: 'Join discussions about classes, careers, and campus life.',
                color: 'amber'
              },
              { 
                icon: Code2, 
                title: 'Fast & Modern', 
                desc: 'Built with the latest tools for a fast and smooth experience.',
                color: 'rose'
              },
              { 
                icon: Star, 
                title: 'Student Voice', 
                desc: 'We build what you need. LCC Hub grows based on your feedback.',
                color: 'purple'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
              >
                <div className={`h-12 w-12 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h2 className="text-3xl font-black mb-6">Built for Performance.</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                LCC Hub is engineered with the latest web standards to ensure a lightning-fast, secure, and accessible experience on every device.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Ably Realtime', 'Firebase'].map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="aspect-square bg-blue-50 rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:bg-blue-600 hover:text-white transition-all duration-500">
                <Zap className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-sm">Real-time</p>
                <p className="text-[10px] opacity-60 font-bold uppercase mt-1">Updates</p>
              </div>
              <div className="aspect-square bg-indigo-50 rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:bg-indigo-600 hover:text-white transition-all duration-500">
                <Cpu className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-sm">AI Engine</p>
                <p className="text-[10px] opacity-60 font-bold uppercase mt-1">Gemma-3</p>
              </div>
              <div className="aspect-square bg-emerald-50 rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:bg-emerald-600 hover:text-white transition-all duration-500">
                <ShieldCheck className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-sm">Secure</p>
                <p className="text-[10px] opacity-60 font-bold uppercase mt-1">AES-256</p>
              </div>
              <div className="aspect-square bg-amber-50 rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:bg-amber-600 hover:text-white transition-all duration-500">
                <Users className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-sm">Community</p>
                <p className="text-[10px] opacity-60 font-bold uppercase mt-1">Vibrant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-blue-600 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to upgrade your school experience?</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Link 
                href="/" 
                className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl active:opacity-70"
              >
                Launch Hub
              </Link>
              <Link 
                href="/disclaimer" 
                className="px-10 py-5 bg-blue-700/50 backdrop-blur-sm text-white border border-blue-400/30 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all active:opacity-70 flex items-center gap-2"
              >
                View Disclaimer
                <ExternalLink size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="pb-12 pt-6 border-t border-slate-100 max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">
          LCC Hub &copy; {new Date().getFullYear()} • Independent Community Project
        </p>
      </footer>
    </div>
  );
}

function Sparkles({ size }: { size: number }) {
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
