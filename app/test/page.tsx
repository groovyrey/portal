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
  CheckCircle2
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

const DAYS_MAP: Record<string, number> = {
  'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
};

const COLORS = {
  class: 'bg-blue-500',
  payment: 'bg-rose-500',
  today: 'bg-slate-900',
};

function parsePaymentsToEvents(financials: Financials | undefined, year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  if (!financials?.installments) return events;
  financials.installments.forEach((inst, idx) => {
    // Handle MM/DD/YYYY or MM-DD-YYYY
    const dateParts = inst.dueDate.split(/[\/\-]/);
    if (dateParts.length !== 3) return;
    
    // Some formats are YYYY-MM-DD, others are MM/DD/YYYY
    let m, d, y;
    if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(dateParts[0]);
      m = parseInt(dateParts[1]) - 1;
      d = parseInt(dateParts[2]);
    } else {
      // MM/DD/YYYY
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
        color: COLORS.payment
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
      toast.error('No email found in your portal record to verify against.');
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
        toast.success('Google account verified! This email matches your portal records.');
        
        // Auto fetch events after verification
        if (token) {
          fetchGoogleEvents(token);
        }
      } else {
        toast.error(`Email mismatch: ${googleEmail} is not ${student.email}`);
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsLinking(false);
    }
  };

  const fetchGoogleEvents = async (token: string) => {
    setIsFetchingGoogle(true);
    console.log('Fetching Google events with token:', token.substring(0, 10) + '...');
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        
        // Filter out cancelled events and de-duplicate by ID or summary+date
        const seenIds = new Set();
        const seenSummaryDate = new Set();
        
        const filteredEvents = items.filter((event: any) => {
          if (event.status === 'cancelled') return false;
          
          const dateStr = (event.start?.dateTime || event.start?.date || '').substring(0, 10);
          const uniqueKey = event.recurringEventId || event.id;
          const summaryDateKey = `${event.summary}-${dateStr}`;

          if (seenIds.has(uniqueKey)) return false;
          if (seenSummaryDate.has(summaryDateKey)) return false;

          seenIds.add(uniqueKey);
          seenSummaryDate.add(summaryDateKey);
          return true;
        });

        setGoogleEvents(filteredEvents);
        toast.success(`Retrieved ${filteredEvents.length} events from Google Calendar`);
      } else {
        const status = response.status;
        const errorText = await response.text();
        console.error(`Google Calendar API Error ${status}:`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(`Google API Error (${status}): ${errorJson.error?.message || 'Unknown error'}`);
        } catch (e) {
          toast.error(`Google API Error (${status}): See console for details`);
        }
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Error connecting to Google Calendar');
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
    link.setAttribute('download', 'student_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader student={student} />

        <div className="mt-8 space-y-6">
          {/* Account Sync Card */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Mail className="h-32 w-32 rotate-12" />
            </div>
            
            <div className="flex items-center gap-5 z-10">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${linkedEmail ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
                {linkedEmail ? <CheckCircle2 className="h-7 w-7 text-white" /> : <Mail className="h-7 w-7 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  {linkedEmail ? 'Account Verified' : 'Sync Google Account'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                  {linkedEmail ? `Connected as: ${linkedEmail}` : `Target: ${student.email || 'No email set'}`}
                </p>
              </div>
            </div>

            <div className="z-10 w-full md:w-auto">
              {linkedEmail ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => fetchGoogleEvents(googleAccessToken!)}
                      disabled={isFetchingGoogle}
                      className="flex-1 md:flex-none px-6 py-3.5 bg-accent text-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isFetchingGoogle ? (
                        <div className="h-3 w-3 border-2 border-slate-900/30 border-t-slate-900 animate-spin rounded-full" />
                      ) : (
                        <CalendarIcon className="h-4 w-4" />
                      )}
                      Refresh
                    </button>
                    <button 
                      onClick={handleGoogleVerify}
                      disabled={isLinking}
                      className="flex-1 md:flex-none px-6 py-3.5 bg-card border border-border text-muted-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                    >
                      Re-verify
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGoogleVerify}
                  disabled={isLinking || !student.email}
                  className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLinking ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4" />
                      Verify with Google
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Google Calendar Events List */}
          {linkedEmail && (
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Google Calendar Events</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isFetchingGoogle ? 'Fetching your events...' : `${googleEvents.length} events found on Google`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-[400px] overflow-y-auto no-scrollbar">
                {isFetchingGoogle ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : googleEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                      <CalendarIcon className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">No events found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {googleEvents.map((event) => {
                      const start = event.start?.dateTime || event.start?.date;
                      const startDate = start ? new Date(start) : null;
                      return (
                        <div key={event.id} className="p-4 rounded-2xl border border-border bg-accent/50 hover:border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30/20 transition-all group">
                          <div className="flex items-start gap-4">
                            <div className="w-16 shrink-0 text-center border-r border-border pr-4">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                {startDate?.toLocaleString('default', { month: 'short' })}
                              </p>
                              <p className="text-xl font-black text-foreground leading-none mt-1">
                                {startDate?.getDate()}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">
                                {startDate?.toLocaleString('default', { weekday: 'short' })}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate uppercase tracking-tight group-hover:text-emerald-600 dark:text-emerald-400 transition-colors">
                                {event.summary || 'Untitled Event'}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                  <Clock className="h-3 w-3" />
                                  {startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[200px]">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls & Export */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm">
              <button 
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-slate-900 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </button>
              <button 
                onClick={() => setView('agenda')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'agenda' ? 'bg-slate-900 text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <ListTodo className="h-4 w-4" />
                Agenda
              </button>
            </div>

            <button 
              onClick={downloadICS}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-card border border-border text-foreground rounded-xl text-xs font-bold hover:bg-accent transition-all shadow-sm active:scale-95 group"
            >
              <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
              Sync to Device (iCal)
            </button>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">{monthName} {year}</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {events.length} Events this month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-border"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-border"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {view === 'calendar' ? (
                  <motion.div 
                    key="calendar-view"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`pad-${i}`} className="h-20 sm:h-32 rounded-2xl bg-accent/50 border border-transparent" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const date = new Date(year, month, dayNum);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayEvents = events.filter(e => e.date.getDate() === dayNum);
                        return (
                          <div 
                            key={dayNum} 
                            className={`h-24 sm:h-32 rounded-2xl border p-1.5 sm:p-3 flex flex-col gap-1 transition-all ${
                              isToday 
                                ? 'bg-accent border-slate-900/10 ring-1 ring-slate-900/5' 
                                : 'bg-card border-border hover:border-border'
                            }`}
                          >
                            <span className={`text-xs font-bold ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {dayNum}
                            </span>
                            <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                              {dayEvents.map(event => (
                                <div 
                                  key={event.id}
                                  className={`px-1.5 py-0.5 rounded sm:rounded-md text-[8px] sm:text-[10px] font-bold text-white truncate shadow-sm ${event.color}`}
                                  title={event.title}
                                >
                                  {event.type === 'class' ? (event.title.split(' - ')[0]) : '₱ PAY'}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="agenda-view"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-sm font-medium text-muted-foreground">No events scheduled for this month.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {events.map((event) => (
                          <div key={event.id} className="py-4 flex items-start gap-4 group">
                            <div className="flex flex-col items-center justify-center w-12 shrink-0">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                {event.date.toLocaleString('default', { weekday: 'short' })}
                              </span>
                              <span className="text-lg font-black text-foreground">
                                {event.date.getDate()}
                              </span>
                            </div>
                            <div className={`h-12 w-1 shrink-0 rounded-full ${event.color}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                                {event.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                {event.startTime && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                    <Clock className="h-3 w-3" />
                                    {event.startTime} - {event.endTime}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                                {event.amount && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                    <CreditCard className="h-3 w-3" />
                                    Outstanding: {event.amount}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="hidden sm:block">
                              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                                event.type === 'class' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                              }`}>
                                {event.type}
                              </div>
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

          <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-card rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Due Dates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-900" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Day</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
