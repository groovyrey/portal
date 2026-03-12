'use client';

import React, { useEffect, useState } from 'react';
import { 
  User,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  Heart,
  ShieldCheck,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Student } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import BadgeDisplay from '@/components/shared/BadgeDisplay';

export default function TeamPage() {
  const [staff, setStaff] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.success) {
          setStaff(data.staff); 
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
            Staff & Moderators
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight mb-6 uppercase tracking-tight italic">
            LCC Hub <span className="text-primary">Team.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto font-medium">
            The dedicated students who maintain the community and help fellow LCCians.
          </p>
        </motion.div>
      </section>

      {/* Team Grid */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : staff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((member, i) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm group hover:border-primary/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/student/${member.id}`}>
                      <h4 className="font-black text-sm uppercase tracking-tight truncate hover:text-primary transition-colors">
                        {member.parsedName?.firstName} {member.parsedName?.lastName}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      {member.course}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <BadgeDisplay badgeIds={member.badges} size="md" />
                  <Link 
                    href={`/student/${member.id}`}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/5 border border-dashed border-border rounded-3xl">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No staff members listed yet.</p>
          </div>
        )}
      </section>

      {/* Contribution Section */}
      <section className="py-20 px-4 max-w-2xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/10 rounded-3xl p-10"
        >
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight mb-3 italic">Join the Force</h2>
          <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed">
            Interested in becoming a staff member? Help us maintain the community and improve the LCC Hub experience.
          </p>
          <Link 
            href="/about" 
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all mx-auto w-fit"
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <footer className="py-12 text-center">
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} LCC Hub • Strategic Intelligence Standard
        </p>
      </footer>
    </div>
  );
}
