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
  Plus,
  Trash2,
  Info,
  Award,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGE_LIST } from '@/lib/badges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
      toast.error(`${student.name} has no email address.`);
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
      toast.error('Missing subject or body.');
      return;
    }

    if (targetType === 'specific' && selectedStudents.length === 0) {
      toast.error('Select at least one recipient.');
      return;
    }

    if (targetType === 'badges' && selectedBadges.length === 0) {
      toast.error('Select at least one badge group.');
      return;
    }

    setIsSending(true);
    setResults(null);
    const toastId = toast.loading('Sending announcements...');

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
        toast.success(`Sent to ${data.results.success} students.`, { id: toastId });
        if (data.results.failure === 0) {
          setSubject('');
          setBody('');
          setSelectedStudents([]);
          setSelectedBadges([]);
        }
      } else {
        toast.error(data.error || 'Failed to send', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Announcement Center</h2>
          <p className="text-sm text-muted-foreground">Broadcast official messages to students.</p>
        </div>

        <div className="flex bg-muted p-1 rounded-md">
          <Button
            variant={targetType === 'specific' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTargetType('specific')}
            className="h-8 text-xs"
          >
            Specific
          </Button>
          <Button
            variant={targetType === 'badges' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTargetType('badges')}
            className="h-8 text-xs"
          >
            By Badge
          </Button>
          <Button
            variant={targetType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTargetType('all')}
            className="h-8 text-xs"
          >
            All Students
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recipient Selection */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recipients
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            {targetType === 'all' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 bg-muted/20 border-dashed border-2 rounded-md">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">Global Broadcast</p>
                  <p className="text-xs text-muted-foreground">Message will reach every registered student.</p>
                </div>
              </div>
            ) : targetType === 'badges' ? (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2 pb-4">
                  {BADGE_LIST.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => toggleBadge(badge.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-md border text-left transition-all",
                        selectedBadges.includes(badge.id) 
                          ? "border-primary/50 bg-primary/5 shadow-sm" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Award className={cn("h-4 w-4", selectedBadges.includes(badge.id) ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className="text-xs font-bold uppercase">{badge.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.description}</p>
                        </div>
                      </div>
                      {selectedBadges.includes(badge.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />}

                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-20 overflow-hidden"
                      >
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleAddStudent(s)}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted text-left transition-colors border-b last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{s.course || s.id}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ScrollArea className="flex-1 -mx-1 pr-1">
                  <div className="space-y-2 pb-4">
                    {selectedStudents.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground opacity-50">
                        <User className="h-10 w-10 mx-auto mb-2" />
                        <p className="text-xs font-medium uppercase tracking-widest">No recipients</p>
                      </div>
                    ) : (
                      selectedStudents.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-muted/30 border rounded-md group">
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.id}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStudent(s.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
          {targetType === 'badges' && selectedBadges.length > 0 && (
            <div className="p-4 border-t bg-muted/10 text-center">
              <p className="text-[10px] font-bold uppercase text-primary">Selected {selectedBadges.length} Badge Groups</p>
            </div>
          )}
        </Card>

        {/* Message Content */}
        <Card className="lg:col-span-3 flex flex-col h-[600px]">
          <CardHeader className="py-4 border-b">
             <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4" />
                Composition
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Official Announcement: [Subject]"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="font-bold"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="body">Message Body</Label>
                <textarea
                  id="body"
                  placeholder="Enter details..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="flex-1 w-full bg-background border border-input rounded-md p-4 text-sm resize-none focus:ring-1 focus:ring-primary outline-none custom-scrollbar"
                />
              </div>

              {results && (
                <div className={cn(
                  "p-4 rounded-md border",
                  results.failure === 0 ? "bg-emerald-50 border-emerald-200" : "bg-warning-50 border-warning-200"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    {results.failure === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-warning-600" />}
                    <p className="text-xs font-bold uppercase">Transmission Report</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ReportStat label="Target" value={results.total} />
                    <ReportStat label="Sent" value={results.success} color="text-emerald-600" />
                    <ReportStat label="Failed" value={results.failure} color="text-destructive" />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendEmails}
              disabled={isSending || !subject.trim() || !body.trim() || (targetType === 'specific' && selectedStudents.length === 0) || (targetType === 'badges' && selectedBadges.length === 0)}
              size="lg"
              className="w-full h-12 uppercase font-bold tracking-widest"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Dispatch
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportStat({ label, value, color }: { label: string, value: number, color?: string }) {
    return (
        <div className="text-center p-2 rounded bg-background border border-border/50">
            <p className="text-[8px] font-bold text-muted-foreground uppercase">{label}</p>
            <p className={cn("text-lg font-black tabular-nums", color)}>{value}</p>
        </div>
    );
}
