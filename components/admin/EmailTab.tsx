'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  User, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Plus,
  Trash2,
  Info,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGE_LIST } from '@/lib/badges';

interface Student {
  id: string;
  name: string;
  email?: string;
  course?: string;
}

interface SendResults {
  total: number;
  success: number;
  failure: number;
  errors?: string[];
}

export default function EmailTab() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific' | 'badges'>('specific');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<SendResults | null>(null);

  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/students?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          // Filter out already selected students
          const filtered = data.students.filter(
            (s: Student) => !selectedStudents.some(selected => selected.id === s.id)
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStudents]);

  const handleAddStudent = (student: Student) => {
    if (!student.email) {
      toast.error(`${student.name} does not have an email address recorded.`);
      return;
    }
    setSelectedStudents([...selectedStudents, student]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveStudent = (id: string) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(id => id !== badgeId) 
        : [...prev, badgeId]
    );
  };

  const handleSendEmails = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please provide both subject and body.');
      return;
    }

    if (targetType === 'specific' && selectedStudents.length === 0) {
      toast.error('Please select at least one recipient.');
      return;
    }

    if (targetType === 'badges' && selectedBadges.length === 0) {
      toast.error('Please select at least one badge.');
      return;
    }

    setIsSending(true);
    setResults(null);
    const toastId = toast.loading(
      targetType === 'all' 
        ? 'Broadcasting to all students...' 
        : targetType === 'badges'
        ? `Broadcasting to students with ${selectedBadges.length} selected badges...`
        : `Sending to ${selectedStudents.length} recipients...`
    );

    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: targetType === 'all' 
            ? 'all' 
            : targetType === 'badges'
            ? { badges: selectedBadges }
            : selectedStudents.map(s => s.id),
          subject,
          body
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        toast.success(`Broadcasting complete! ${data.results.success} sent successfully.`, { id: toastId });
        if (data.results.failure === 0) {
          // Reset form on total success
          setSubject('');
          setBody('');
          setSelectedStudents([]);
          setSelectedBadges([]);
        }
      } else {
        toast.error(data.error || 'Failed to send emails', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error while sending emails', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Announcement Center
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Dispatch official communications to the student body
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-xl gap-1 self-start flex-wrap">
          <button
            onClick={() => setTargetType('specific')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${targetType === 'specific' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Specific
          </button>
          <button
            onClick={() => setTargetType('badges')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${targetType === 'badges' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            By Badge
          </button>
          <button
            onClick={() => setTargetType('all')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${targetType === 'all' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All Students
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recipient Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="surface-neutral p-5 rounded-2xl border border-border/50 h-full flex flex-col min-h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="h-3 w-3" />
              Recipients
            </h3>

            {targetType === 'all' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Global Broadcast</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Email will be sent to all registered students</p>
                </div>
              </div>
            ) : targetType === 'badges' ? (
              <div className="flex-1 flex flex-col space-y-3">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Select Targeting Badges</p>
                 <div className="grid grid-cols-1 gap-2 overflow-y-auto custom-scrollbar pr-1">
                    {BADGE_LIST.map((badge) => (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedBadges.includes(badge.id) 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                            : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`p-1.5 rounded-lg ${selectedBadges.includes(badge.id) ? 'bg-primary/20' : 'bg-muted'}`}>
                              <Award className="h-3.5 w-3.5" />
                           </div>
                           <div className="text-left">
                              <p className="text-[11px] font-bold uppercase tracking-tight">{badge.name}</p>
                              <p className="text-[8px] font-medium opacity-60 uppercase">{badge.description}</p>
                           </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          selectedBadges.includes(badge.id) ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                           {selectedBadges.includes(badge.id) && <Plus className="h-2.5 w-2.5 text-white rotate-45" />}
                        </div>
                      </button>
                    ))}
                 </div>
                 {selectedBadges.length > 0 && (
                   <div className="mt-auto pt-4 border-t border-border/50">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                        Targeting {selectedBadges.length} Badge Groups
                      </p>
                   </div>
                 )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    </div>
                  )}

                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar"
                      >
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleAddStudent(s)}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted text-left transition-colors border-b last:border-0 border-border/50"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate">{s.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-tight">{s.course || s.id}</p>
                            </div>
                            <Plus className="h-3 w-3 text-primary shrink-0" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px] max-h-[300px] space-y-2 pr-1">
                  {selectedStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                      <User className="h-8 w-8 mb-2" />
                      <p className="text-[10px] font-bold uppercase">No recipients selected</p>
                    </div>
                  ) : (
                    selectedStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl group">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-foreground truncate">{s.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-tight">{s.id}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(s.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="surface-neutral p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-2">
              <Info className="h-3 w-3" />
              Message Details
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                <input
                  type="text"
                  placeholder="Official Announcement: [Subject]"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Body Content</label>
                <textarea
                  placeholder="Enter the announcement details here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all resize-none custom-scrollbar"
                />
              </div>

              {results && (
                <div className={`p-4 rounded-xl border ${results.failure === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {results.failure === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <p className="text-xs font-black uppercase tracking-tight text-foreground">
                      Transmission Report
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Target</p>
                      <p className="text-lg font-black">{results.total}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Sent</p>
                      <p className="text-lg font-black text-emerald-500">{results.success}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Failed</p>
                      <p className="text-lg font-black text-red-500">{results.failure}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSendEmails}
                disabled={isSending || !subject.trim() || !body.trim() || (targetType === 'specific' && selectedStudents.length === 0) || (targetType === 'badges' && selectedBadges.length === 0)}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Transmission...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
