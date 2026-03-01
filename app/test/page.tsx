'use client';

import { useState, useMemo } from 'react';
import { useStudentQuery } from '@/lib/hooks';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Clock, 
  MapPin, 
  CreditCard, 
  CalendarDays,
  ListTodo,
  Mail,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleItem, Financials } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { auth, googleProvider } from '@/lib/db';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { toast } from 'sonner';

// --- Types ---
interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'payment';
  date: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  amount?: string;
  description?: string;
  color: string;
}

// --- Helper Functions ---

const COLORS = {
  class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  payment: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  today: 'bg-primary/5 border-primary/20',
};

function parsePaymentsToEvents(financials: Financials | undefined, year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  if (!financials?.installments) return events;
  financials.installments.forEach((inst, idx) => {
    const dateParts = inst.dueDate.split(/[\/\-]/);
    if (dateParts.length !== 3) return;
    
    let m, d, y;
    if (dateParts[0].length === 4) {
      y = parseInt(dateParts[0]);
      m = parseInt(dateParts[1]) - 1;
      d = parseInt(dateParts[2]);
    } else {
      m = parseInt(dateParts[0]) - 1;
      d = parseInt(dateParts[1]);
      y = parseInt(dateParts[2]);
    }

    if (y === year && m === month) {
      events.push({
        id: `pay-${idx}`,
        title: `Payment: ${inst.description}`,
        type: 'payment',
        date: new Date(y, m, d),
        amount: inst.outstanding,
        color: 'bg-rose-500'
      });
    }
  });
  return events;
}

function generateICS(schedule: ScheduleItem[]) {
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student Portal//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  schedule.forEach((item) => {
    const parts = item.time.split(' ');
    if (parts.length < 2) return;
    const daysStr = parts[0];
    const timeRange = parts.slice(1).join(' ');
    const [startT, endT] = timeRange.split('-');

    const formatTime = (t: string) => {
      if (!t) return "000000";
      const match = t.match(/(\d+):(\d+)(AM|PM)/i);
      if (!match) return "000000";
      let h = parseInt(match[1]);
      const m = match[2];
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}${m}00`;
    };

    const rruleDays = daysStr.split('-').map(d => d.substring(0, 2).toUpperCase()).join(',');
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const dateStr = startOfWeek.toISOString().split('T')[0].replace(/-/g, '');

    ics.push('BEGIN:VEVENT');
    ics.push(`SUMMARY:${item.subject}`);
    ics.push(`DESCRIPTION:${item.description} - Section: ${item.section}`);
    ics.push(`LOCATION:${item.room}`);
    ics.push(`DTSTART;TZID=Asia/Manila:${dateStr}T${formatTime(startT)}`);
    ics.push(`DTEND;TZID=Asia/Manila:${dateStr}T${formatTime(endT)}`);
    ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export default function TestCalendarPage() {
  const { data: student, isLoading } = useStudentQuery();
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLinking, setIsLinking] = useState(false);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleGoogleVerify = async () => {
    if (!student?.email) {
      toast.error('No email found in your portal record.');
      return;
    }

    setIsLinking(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (googleEmail?.toLowerCase() === student.email.toLowerCase()) {
        setLinkedEmail(googleEmail);
        setGoogleAccessToken(token || null);
        toast.success('Account synced successfully');
        if (token) fetchGoogleEvents(token);
      } else {
        toast.error(`Email mismatch: ${googleEmail} is not ${student.email}`);
        await auth.signOut();
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsLinking(false);
    }
  };

  const fetchGoogleEvents = async (token: string) => {
    setIsFetchingGoogle(true);
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoogleEvents(data.items || []);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setIsFetchingGoogle(false);
    }
  };

  const events = useMemo(() => {
    if (!student) return [];
    const payEvents = parsePaymentsToEvents(student.financials, year, month);
    return [...payEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [student, year, month]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const downloadICS = () => {
    if (!student?.schedule) return;
    const content = generateICS(student.schedule);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-background/50 font-sans text-foreground pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader student={student} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column: Sync & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${linkedEmail ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                  {linkedEmail ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Google Calendar</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{linkedEmail ? 'Synced' : 'Not Connected'}</p>
                </div>
              </div>

              {linkedEmail ? (
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-accent/50 rounded-lg border border-border overflow-hidden">
                    <p className="text-[10px] text-muted-foreground truncate">{linkedEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchGoogleEvents(googleAccessToken!)}
                      disabled={isFetchingGoogle}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isFetchingGoogle ? 'animate-spin' : ''}`} />
                      Sync
                    </button>
                    <button 
                      onClick={handleGoogleVerify}
                      className="px-3 py-2 bg-accent text-foreground rounded-lg text-xs font-medium hover:bg-accent/80 transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGoogleVerify}
                  disabled={isLinking}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-lg text-xs font-medium hover:opacity-90 transition-all"
                >
                  {isLinking ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Connect Account
                </button>
              )}
            </div>

            {linkedEmail && googleEvents.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Events</h3>
                <div className="space-y-3">
                  {googleEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="group cursor-default">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">{event.summary}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : 'All day'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={downloadICS}
              className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border text-foreground rounded-2xl text-xs font-semibold hover:bg-accent transition-all shadow-sm group active:scale-[0.98]"
            >
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              Export Schedule (.ics)
            </button>
          </div>

          {/* Right Column: Calendar/Agenda */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-accent p-1 rounded-xl border border-border">
                    <button 
                      onClick={() => setView('calendar')}
                      className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setView('agenda')}
                      className={`p-2 rounded-lg transition-all ${view === 'agenda' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{monthName} {year}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Today
                  </button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {view === 'calendar' ? (
                    <motion.div 
                      key="calendar"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="grid grid-cols-7 gap-px mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="text-center py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-accent/20" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const date = new Date(year, month, dayNum);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const dayEvents = events.filter(e => e.date.getDate() === dayNum);
                          
                          return (
                            <div 
                              key={dayNum} 
                              className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                                isToday 
                                  ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                                  : 'bg-background border-border hover:border-muted-foreground/30'
                              }`}
                            >
                              <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-foreground/70'}`}>
                                {dayNum}
                              </span>
                              <div className="flex gap-0.5">
                                {dayEvents.map(e => (
                                  <div key={e.id} className={`h-1 w-1 rounded-full ${e.type === 'class' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="agenda"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {events.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-muted-foreground">No upcoming events this month.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {events.map((event) => (
                            <div key={event.id} className="p-4 rounded-2xl border border-border bg-accent/30 flex items-center gap-4 group hover:border-primary/30 transition-all">
                              <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{event.date.toLocaleString('default', { weekday: 'short' })}</span>
                                <span className="text-base font-bold">{event.date.getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  {event.startTime && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {event.startTime}
                                    </div>
                                  )}
                                  {event.amount && (
                                    <div className="flex items-center gap-1 text-[10px] text-rose-500 font-medium">
                                      <CreditCard className="h-3 w-3" />
                                      {event.amount}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                event.type === 'class' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {event.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 py-4 px-6 bg-card border border-border rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
