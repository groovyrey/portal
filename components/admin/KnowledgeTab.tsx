'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  School, 
  MapPin, 
  GraduationCap, 
  Info, 
  Building2, 
  ClipboardCheck,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  SCHOOL_INFO, 
  ACADEMIC_PROGRAMS, 
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES,
  IMPORTANT_OFFICES
} from '@/lib/assistant-knowledge';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

type Category = 'overview' | 'academic' | 'campus' | 'admin';

export default function KnowledgeTab() {
  const [activeTab, setActiveTab] = useState<Category>('overview');

  const categories = [
    { id: 'overview', label: 'School Profile', icon: <School size={14} /> },
    { id: 'academic', label: 'Academic Programs', icon: <GraduationCap size={14} /> },
    { id: 'campus', label: 'Campus & Facilities', icon: <MapPin size={14} /> },
    { id: 'admin', label: 'Procedures & Grading', icon: <ClipboardCheck size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id as Category)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all
              ${activeTab === cat.id 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'bg-card border border-border text-muted-foreground hover:bg-accent'}
            `}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <School size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{SCHOOL_INFO.name}</h3>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">{SCHOOL_INFO.tagline}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Our Vision</h4>
                    <p className="text-xs leading-relaxed text-foreground font-medium">{SCHOOL_INFO.vision}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Our Mission</h4>
                    <p className="text-xs leading-relaxed text-foreground font-medium">{SCHOOL_INFO.mission}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* History & Core Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-3">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Info size={12} className="text-primary" />
                  Institutional History
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  {SCHOOL_INFO.history}
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Core Values</h4>
                <div className="space-y-2">
                  {SCHOOL_INFO.coreValues.map((value, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl border border-primary/10">
                      <ChevronRight size={12} className="text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-tight">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'academic' && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">College Programs</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">CHED Recognized Degrees</p>
              </div>
              <div className="space-y-2">
                {ACADEMIC_PROGRAMS.college.map((program, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors group">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{program}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Technical Vocational</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">TESDA Accredited Courses</p>
                </div>
                <div className="space-y-2">
                  {ACADEMIC_PROGRAMS.tesda.map((program, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/50">
                      <p className="text-xs font-bold text-foreground">{program}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-accent/30 border border-border rounded-2xl p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Basic Education</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">K-12 Pathways</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACADEMIC_PROGRAMS.basic_ed.map((level, i) => (
                    <span key={i} className="px-3 py-1.5 bg-background border border-border rounded-lg text-[10px] font-black uppercase">
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'campus' && (
          <motion.div
            key="campus"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Campus List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SCHOOL_INFO.campuses.map((campus, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">{campus.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{campus.address}</p>
                  </div>
                  <div className="pt-2 space-y-1">
                    {campus.mobile && <p className="text-[10px] font-mono text-muted-foreground">{campus.mobile}</p>}
                    {campus.phone && <p className="text-[10px] font-mono text-muted-foreground">{campus.phone}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Building Codes */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Facility Reference</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Building Codes & Locations</p>
                </div>
                <div className="hidden sm:block px-3 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase text-muted-foreground">
                  {Object.keys(BUILDING_CODES).length} Units Logged
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(BUILDING_CODES).map(([code, name]) => (
                  <div key={code} className="flex items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-black">
                      {code}
                    </div>
                    <p className="text-[11px] font-bold text-foreground truncate">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Grading Standard</h3>
                <div className="bg-muted/30 rounded-xl p-4 font-mono">
                  <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">{GRADING_SYSTEM.trim()}</pre>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Common Procedures</h3>
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  <MarkdownRenderer content={COMMON_PROCEDURES} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Key Offices</h3>
                <div className="space-y-4">
                  {IMPORTANT_OFFICES.map((office, i) => (
                    <div key={i} className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">{office.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                        {office.purpose}
                      </p>
                      {i !== IMPORTANT_OFFICES.length - 1 && <div className="pt-3 border-b border-primary/5" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
                <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Search size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-foreground">Missing something?</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed px-4">
                    The knowledge base is updated manually. Contact the dev team to add more info.
                  </p>
                </div>
                <button className="w-full py-2 bg-muted hover:bg-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                  Request Update
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
