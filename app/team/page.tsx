'use client';

import React, { useEffect, useState } from 'react';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Globe, 
  Mail, 
  ShieldCheck, 
  Code2, 
  Palette, 
  Terminal,
  ChevronRight,
  ArrowRight,
  Heart,
  Sparkles,
  User,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Student } from '@/types';
import { obfuscateId } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  icon: React.ElementType;
  color: string;
  socials: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  badges: string[];
  id?: string;
}

const coreMembers: TeamMember[] = [
  {
    name: 'Reymart Centeno',
    role: 'Lead Developer',
    description: 'Architect behind LCC Hub. Focused on creating seamless academic experiences through modern web technologies.',
    icon: Terminal,
    color: 'text-blue-500 bg-blue-500/10',
    socials: {
      github: 'https://github.com/groovyrey',
      website: 'https://reymart.me'
    },
    badges: ['Founder', 'Fullstack']
  },
  {
    name: 'Cato AI',
    role: 'Core Intelligence',
    description: 'The strategic brain of the workspace, providing context-aware research and automated lecture synthesis.',
    icon: Sparkles,
    color: 'text-primary bg-primary/10',
    socials: {},
    badges: ['AI', '24/7 Availability']
  }
];

export default function TeamPage() {
  const [staff, setStaff] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.success) {
          // Filter out Reymart if he is in the staff list to avoid duplication
          setStaff(data.staff.filter((s: Student) => s.id !== '1210453')); 
        }
      } catch (e) {
        console.error('Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden pb-20 font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div {...fadeIn}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider mb-6">
            The Creative Force
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6 uppercase tracking-tight italic">
            Meet the <span className="text-primary">Makers.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto font-medium">
            LCC Hub is built and maintained by a dedicated team of students and artificial intelligence, working together to redefine the LCCian academic experience.
          </p>
        </motion.div>
      </section>

      {/* Team Grid */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="space-y-20">
          {/* Core Team */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="h-[1px] flex-1 bg-border/50" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Core Infrastructure</h2>
              <div className="h-[1px] flex-1 bg-border/50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coreMembers.map((member, i) => (
                <motion.div 
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm group hover:border-primary/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <member.icon size={120} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${member.color} transition-transform group-hover:scale-110 duration-300`}>
                        <member.icon size={32} />
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {member.badges.map(badge => (
                          <span key={badge} className="px-2 py-0.5 rounded bg-muted text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-2xl font-black uppercase tracking-tight italic mb-1 group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                        {member.role}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-8">
                      {member.description}
                    </p>

                    <div className="flex items-center gap-4">
                      {member.socials.github && (
                        <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-all">
                          <Github size={18} />
                        </a>
                      )}
                      {member.socials.website && (
                        <a href={member.socials.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-muted hover:bg-primary hover:text-white rounded-lg transition-all">
                          <Globe size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Student Staff */}
          {(loading || staff.length > 0) && (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="h-[1px] flex-1 bg-border/50" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Student Staff & Moderators</h2>
                <div className="h-[1px] flex-1 bg-border/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)
                ) : (
                  staff.map((member, i) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="bg-card/50 border border-border/40 rounded-2xl p-6 shadow-sm group hover:border-primary/20 transition-all text-center relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                          <User className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <Link href={`/profile/${obfuscateId(member.id)}`}>
                          <h4 className="font-black text-sm uppercase tracking-tight mb-1 truncate px-2 hover:text-primary transition-colors">
                            {member.parsedName?.firstName} {member.parsedName?.lastName}
                          </h4>
                        </Link>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                            {member.course}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                          {(member.badges || []).map(badge => (
                            <span key={badge} className="px-1.5 py-0.5 rounded-md bg-primary/5 text-[7px] font-black uppercase tracking-widest text-primary border border-primary/10">
                              {badge}
                            </span>
                          ))}
                        </div>
                        <Link 
                          href={`/profile/${obfuscateId(member.id)}`}
                          className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                        >
                          View Profile
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contribution Section */}
...
      <section className="py-24 px-4 max-w-4xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-muted/30 border border-dashed border-border rounded-3xl p-12"
        >
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4 italic">Want to contribute?</h2>
          <p className="text-muted-foreground font-medium mb-10 max-w-lg mx-auto leading-relaxed">
            LCC Hub is an open project. If you are an LCCian developer, designer, or researcher, we would love to have you on board.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
             <Link 
                href="/about" 
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a 
                href="https://github.com/groovyrey/portal" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-card border border-border text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
              >
                Github Repo
              </a>
          </div>
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 text-center">
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} LCC Hub • Strategic Intelligence Standard
        </p>
      </footer>
    </div>
  );
}
