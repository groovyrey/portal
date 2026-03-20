import React from 'react';
import { 
  ExternalLink, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Building2, 
  GraduationCap, 
  Calendar,
  ChevronRight,
  ArrowLeft,
  Target,
  Compass,
  History,
  BookOpen,
  Award,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { SCHOOL_INFO, ACADEMIC_PROGRAMS } from '@/lib/assistant-knowledge';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Information',
  description: 'Learn more about La Concepcion College, its mission, vision, and academic programs.',
};

const SchoolInfoPage = () => {
  const officialLinks = [
    { name: 'Official Student Portal', url: 'https://premium.schoolista.com/LCC/', description: 'Access the official school management system directly.' },
    { name: 'LCC Official Website', url: SCHOOL_INFO.socials.website, description: 'Main institutional website for news and announcements.' },
    { name: 'LCC Facebook Page', url: SCHOOL_INFO.socials.facebook, description: 'Latest updates, events, and community news.' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
          style={{ backgroundImage: 'url("/herobg.jpeg")' }}
        />
        <div className="absolute inset-0 z-10 bg-slate-950/40" />

        <div className="max-w-6xl mx-auto relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="h-24 w-24 bg-primary/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shrink-0 border border-white/10 shadow-2xl">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight uppercase italic">{SCHOOL_INFO.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-tighter rounded-md">EST. 1998</span>
                <p className="text-slate-300 text-sm md:text-lg font-bold uppercase tracking-tight">
                  {SCHOOL_INFO.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-30">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Identity Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card p-6 rounded-3xl border border-border shadow-xl hover:border-primary/30 transition-all group">
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Our Vision</h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  {SCHOOL_INFO.vision}
                </p>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-xl hover:border-primary/30 transition-all group">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-3">Our Mission</h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  {SCHOOL_INFO.mission}
                </p>
              </div>
            </div>

            {/* History Section */}
            <section className="bg-card p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <History className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="h-1 w-8 bg-primary rounded-full" />
                  Institutional History
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                  {SCHOOL_INFO.history}
                </p>
              </div>
            </section>

            {/* Academic Programs */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Academic Offerings</h2>
              <div className="space-y-4">
                {/* Tertiary */}
                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-border bg-accent/30 flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Tertiary Education</h3>
                    </div>
                    <div className="p-6 grid sm:grid-cols-2 gap-x-8 gap-y-2">
                        {ACADEMIC_PROGRAMS.college.map((prog, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0 sm:border-0">
                                <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                <span className="text-[11px] font-bold text-muted-foreground leading-tight">{prog}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Basic Ed */}
                    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-border bg-accent/30 flex items-center gap-3">
                            <Users className="h-4 w-4 text-blue-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Basic Education</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {ACADEMIC_PROGRAMS.basic_ed.map((prog, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-xs font-bold text-muted-foreground">{prog}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TESDA */}
                    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-border bg-accent/30 flex items-center gap-3">
                            <Award className="h-4 w-4 text-amber-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Technical Vocational</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {ACADEMIC_PROGRAMS.tesda.map((prog, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span className="text-xs font-bold text-muted-foreground">{prog}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Core Values */}
            <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Award className="h-32 w-32" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-80 italic">Core Values</h3>
                <div className="space-y-6 relative z-10">
                    {SCHOOL_INFO.coreValues.map((val, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl italic">
                                {val.charAt(0)}
                            </div>
                            <span className="text-lg font-black uppercase tracking-tighter italic">{val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Portals */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xl">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 ml-1">Official Links</h3>
                <div className="space-y-3">
                    {officialLinks.map((link) => (
                        <a 
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            className="group block p-4 bg-accent/30 rounded-2xl border border-transparent hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">{link.name}</h4>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground leading-tight">{link.description}</p>
                        </a>
                    ))}
                </div>
            </div>

            {/* Contact & Campuses */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xl">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 ml-1">Connect With Us</h3>
              
              <div className="space-y-8">
                {SCHOOL_INFO.campuses.map((campus, idx) => (
                    <div key={idx} className="space-y-4">
                        <h4 className="text-xs font-black text-primary uppercase tracking-tight flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {campus.name}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4 ml-5">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                                <p className="text-xs font-bold text-foreground leading-tight">{campus.address}</p>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                                <div className="space-y-1">
                                    {campus.phone && <p className="text-xs font-bold text-foreground">Tel: {campus.phone}</p>}
                                    {campus.mobile && <p className="text-xs font-bold text-foreground">Cel: {campus.mobile}</p>}
                                    {campus.email && <p className="text-xs font-bold text-primary truncate">{campus.email}</p>}
                                </div>
                            </div>
                        </div>
                        {idx !== SCHOOL_INFO.campuses.length - 1 && <div className="border-b border-border/50 pt-4" />}
                    </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <a 
                  href={SCHOOL_INFO.socials.facebook} 
                  target="_blank"
                  className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                >
                  <Facebook className="h-4 w-4" />
                  LCC Facebook Page
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card p-1.5 rounded-3xl border border-border shadow-xl overflow-hidden h-64">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3857.240742151608!2d121.0688846108153!3d14.811802971842918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397afd625759755%3A0x6a1006509a721727!2sLa%20Concepcion%20College!5e0!3m2!1sen!2sph!4v1708100000000!5m2!1sen!2sph" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-[1.25rem]"
              ></iframe>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolInfoPage;
