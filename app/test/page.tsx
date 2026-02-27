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
  BookOpen,
  CalendarDays,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleItem, Financials } from '@/types';
import Skeleton from '@/components/ui/Skeleton';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

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

/**
 * Parses schedule time like "MON-WED-FRI 10:00AM-11:00AM" or "TUE 1:30PM-3:00PM"
 */
function parseScheduleToEvents(schedule: ScheduleItem[], year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  schedule.forEach((item, idx) => {
    if (!item.time) return;

    // Split days and times: "MON-WED-FRI 10:00AM-11:00AM"
    const parts = item.time.split(' ');
    if (parts.length < 2) return;

    const daysStr = parts[0];
    const timeRange = parts.slice(1).join(' ');
    const [startT, endT] = timeRange.split('-');

    // Expand days: "MON-WED-FRI" -> ["MON", "WED", "FRI"]
    const activeDays = daysStr.split('-').map(d => DAYS_MAP[d.toUpperCase()]).filter(d => d !== undefined);

    // Create events for each occurrence in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (activeDays.includes(date.getDay())) {
        events.push({
          id: `class-${idx}-${day}`,
          title: item.subject,
          description: item.description,
          type: 'class',
          date: date,
          startTime: startT,
          endTime: endT,
          location: item.room,
          color: COLORS.class
        });
      }
    }
  });

  return events;
}

function parsePaymentsToEvents(financials: Financials | undefined, year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  if (!financials?.installments) return events;

  financials.installments.forEach((inst, idx) => {
    // Parse "MM/DD/YYYY" or similar formats
    const dateParts = inst.dueDate.split('/');
    if (dateParts.length !== 3) return;

    const m = parseInt(dateParts[0]) - 1;
    const d = parseInt(dateParts[1]);
    const y = parseInt(dateParts[2]);

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

/**
 * Generates iCal (.ics) file content
 */
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

    const daysStr = parts[0]; // e.g. "MON-WED"
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
    
    // We'll set the start date to "this Monday" as a base
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const events = useMemo(() => {
    if (!student) return [];
    const classEvents = parseScheduleToEvents(student.schedule || [], year, month);
    const payEvents = parsePaymentsToEvents(student.financials, year, month);
    return [...classEvents, ...payEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
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
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader student={student} />

        <div className="mt-8 space-y-6">
          {/* Controls & Export */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </button>
              <button 
                onClick={() => setView('agenda')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'agenda' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ListTodo className="h-4 w-4" />
                Agenda
              </button>
            </div>

            <button 
              onClick={downloadICS}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
            >
              <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
              Sync to Device (iCal)
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{monthName} {year}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {events.length} Events this month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-100"
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
                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {/* Padding for first day */}
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`pad-${i}`} className="h-20 sm:h-32 rounded-2xl bg-slate-50/50 border border-transparent" />
                      ))}

                      {/* Actual Days */}
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
                                ? 'bg-slate-50 border-slate-900/10 ring-1 ring-slate-900/5' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <span className={`text-xs font-bold ${isToday ? 'text-slate-900' : 'text-slate-400'}`}>
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
                        <p className="text-sm font-medium text-slate-400">No events scheduled for this month.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {events.map((event) => (
                          <div key={event.id} className="py-4 flex items-start gap-4 group">
                            <div className="flex flex-col items-center justify-center w-12 shrink-0">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {event.date.toLocaleString('default', { weekday: 'short' })}
                              </span>
                              <span className="text-lg font-black text-slate-900">
                                {event.date.getDate()}
                              </span>
                            </div>

                            <div className={`h-12 w-1 shrink-0 rounded-full ${event.color}`} />

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">
                                {event.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                {event.startTime && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                    <Clock className="h-3 w-3" />
                                    {event.startTime} - {event.endTime}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                                {event.amount && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase">
                                    <CreditCard className="h-3 w-3" />
                                    Outstanding: {event.amount}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="hidden sm:block">
                              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                                event.type === 'class' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
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

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Classes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Due Dates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-900" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Day</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
