'use client';

import { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  DatabaseZap, 
  BookOpen, 
  ExternalLink, 
  CalendarDays, 
  ListTodo, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassroomCourse, ClassroomAssignment, CalendarEvent } from '@/types/g-space';
import { Student, Financials, ScheduleItem } from '@/types';
import Skeleton from '@/components/ui/Skeleton';

interface SyncTabProps {
  student: Student;
  linkedEmail: string | null;
  isLinking: boolean;
  isFetching: boolean;
  googleAccessToken: string | null;
  classroomCourses: ClassroomCourse[];
  classroomAssignments: ClassroomAssignment[];
  handleGoogleVerify: () => void;
  fetchAllData: (token: string) => void;
}

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

function parseScheduleToEvents(schedule: ScheduleItem[] | undefined, year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  if (!schedule) return events;

  schedule.forEach((item, idx) => {
    const parts = item.time.split(' ');
    if (parts.length < 2) return;
    const daysStr = parts[0];
    const timeRange = parts.slice(1).join(' ');
    const [startT, endT] = timeRange.split('-');

    const days = daysStr.split('-');
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= numDays; d++) {
      const date = new Date(year, month, d);
      const dayName = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
      if (days.includes(dayName)) {
        events.push({
          id: `class-${idx}-${d}`,
          title: item.description,
          type: 'class',
          date: date,
          startTime: startT,
          endTime: endT,
          location: item.room,
          course: item.subject,
          instructor: item.instructor,
          color: 'bg-blue-500'
        });
      }
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

export default function SyncTab({
  student,
  linkedEmail,
  isLinking,
  isFetching,
  googleAccessToken,
  classroomCourses,
  classroomAssignments,
  handleGoogleVerify,
  fetchAllData
}: SyncTabProps) {
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const events = useMemo(() => {
    if (!student) return [];
    const payEvents = parsePaymentsToEvents(student.financials, year, month);
    const classEvents = parseScheduleToEvents(student.schedule, year, month);
    return [...payEvents, ...classEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
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

  if (!linkedEmail) {
    return (
      <div className="relative min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl -z-10" />
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3">
          <RefreshCw className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-black mb-3">Sync Your Classroom</h2>
        <p className="text-muted-foreground text-sm font-medium max-w-sm mb-8">
          Link your Google account to access your courses, assignments, and schedule in real-time.
        </p>
        <button 
          onClick={handleGoogleVerify}
          disabled={isLinking}
          className="flex items-center justify-center gap-4 px-8 py-4 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl"
        >
          {isLinking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
          {isLinking ? 'Verifying...' : 'Link Google Account'}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Mission Control</h2>
          <p className="text-xs text-muted-foreground font-medium">Monitoring classroom updates and upcoming schedules.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={downloadICS}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-full text-xs font-bold transition-all border border-border/50"
          >
            <Download className="h-3.5 w-3.5" />
            Calendar .ics
          </button>
          <button 
            onClick={() => fetchAllData(googleAccessToken!)}
            disabled={isFetching}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Classroom Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Courses
              </h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {classroomCourses.length}
              </span>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {isFetching && classroomCourses.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
              ) : classroomCourses.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground">No active courses found</p>
                </div>
              ) : (
                classroomCourses.map((course) => (
                  <a 
                    key={course.id} 
                    href={course.alternateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors truncate">{course.name}</p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    </div>
                    <div className="flex flex-col mt-1">
                      <p className="text-[10px] font-bold text-primary/80 uppercase tracking-tight">{course.ownerName || 'Unknown Teacher'}</p>
                      <p className="text-[9px] font-medium text-muted-foreground">{course.section || 'General Section'}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Schedule & Agenda */}
        <div className="lg:col-span-8">
          <div className="bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
                  <button 
                    onClick={() => setView('calendar')}
                    className={`p-1.5 rounded-full transition-all ${view === 'calendar' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setView('agenda')}
                    className={`p-1.5 rounded-full transition-all ${view === 'agenda' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{monthName}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{year}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-muted rounded-full transition-all border border-border/50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all">Today</button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-muted rounded-full transition-all border border-border/50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-[450px]">
              <AnimatePresence mode="wait">
                {view === 'calendar' ? (
                  <motion.div 
                    key="calendar"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square rounded-xl bg-muted/5" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const date = new Date(year, month, dayNum);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayEvents = events.filter(e => e.date.getDate() === dayNum);
                        const dayAssignments = classroomAssignments.filter(a => a.dueDate && a.dueDate.day === dayNum && a.dueDate.month === month + 1 && a.dueDate.year === year);
                        
                        return (
                          <div 
                            key={dayNum} 
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all relative ${
                              isToday 
                                ? 'bg-primary/10 border-primary/50' 
                                : 'bg-background border-border/50 hover:border-primary/20 hover:bg-muted/5'
                            }`}
                          >
                            <span className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-foreground/70'}`}>
                              {dayNum}
                            </span>
                            <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                              {dayEvents.map(e => (
                                <div key={e.id} className={`h-1 w-1 rounded-full ${e.type === 'class' ? 'bg-blue-400' : 'bg-rose-400'}`} />
                              ))}
                              {dayAssignments.length > 0 && <div className="h-1 w-1 rounded-full bg-emerald-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="agenda"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-3"
                  >
                    {[...events, ...classroomAssignments.map(a => ({
                      id: a.id,
                      title: a.title,
                      type: 'assignment' as const,
                      date: a.dueDate ? new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day) : new Date(),
                      course: a.courseName,
                      instructor: a.ownerName,
                      link: a.alternateLink
                    }))].sort((a, b) => a.date.getTime() - b.date.getTime()).map((item: any) => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-2xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-all flex items-center gap-4 group"
                      >
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-background border border-border/50 shrink-0 group-hover:border-primary/30 transition-all">
                          <span className="text-[8px] font-bold uppercase text-muted-foreground">{item.date.toLocaleString('default', { weekday: 'short' })}</span>
                          <span className="text-sm font-bold leading-none">{item.date.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                               item.type === 'payment' ? 'bg-rose-100 text-rose-600' : 
                               item.type === 'assignment' ? 'bg-emerald-100 text-emerald-600' : 
                               'bg-blue-100 text-blue-600'
                            }`}>
                              {item.type}
                            </span>
                            {item.course && <span className="text-[9px] font-bold text-muted-foreground truncate">{item.course}</span>}
                          </div>
                          <h4 className="text-xs font-bold truncate">{item.title}</h4>
                          {item.instructor && (
                            <p className="text-[9px] font-bold text-primary/80 uppercase tracking-tight mt-0.5">{item.instructor}</p>
                          )}
                        </div>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-all">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : item.amount ? (
                          <span className="text-[10px] font-bold text-rose-500">P{item.amount}</span>
                        ) : item.startTime && (
                          <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{item.startTime}</span>
                        )}
                      </div>
                    ))}
                    {events.length === 0 && classroomAssignments.length === 0 && (
                      <div className="py-20 text-center">
                        <p className="text-[11px] font-medium text-muted-foreground">No upcoming events or assignments.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
