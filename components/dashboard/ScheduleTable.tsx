'use client';

import { ScheduleItem, ProspectusSubject } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { X, MapPin, Clock, Hash, BookOpen, Info, Calendar, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  offeredSubjects?: ProspectusSubject[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM', '9:00 PM'
];

const SUBJECT_COLORS = [
  'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-500/20 dark:hover:bg-blue-500/30',
  'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30',
  'bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50 hover:bg-violet-500/20 dark:hover:bg-violet-500/30',
  'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-500/20 dark:hover:bg-amber-500/30',
  'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50 hover:bg-rose-500/20 dark:hover:bg-rose-500/30',
  'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-800/50 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30',
  'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/50 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30',
  'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-500/20 dark:hover:bg-orange-500/30',
];

export default function ScheduleTable({ schedule, offeredSubjects }: ScheduleTableProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const getSubjectCode = (subject: string) => {
    // Extracts "CS 101" from "CS 101 - Computer Science"
    const parts = subject.split(' - ');
    return parts[0].trim();
  };

  const getSubjectName = (subject: string) => {
    const parts = subject.split(' - ');
    if (parts.length > 1) {
      return parts.slice(1).join(' - ').trim();
    }
    
    // Fallback: look it up in offeredSubjects
    if (offeredSubjects) {
      const sub = offeredSubjects.find(s => s.code === subject || s.code === parts[0].trim());
      if (sub) return sub.description;
    }
    
    return subject;
  };

  const getSubjectColor = (subject: string) => {
    let hash = 0;
    const code = getSubjectCode(subject);
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  const parseTimeRange = (timeStr: string) => {
    const timePart = timeStr.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
    if (!timePart) return null;

    const parseTime = (t: string) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour + minute / 60;
    };

    const start = parseTime(timePart[1]);
    const end = parseTime(timePart[2]);
    return (start !== null && end !== null) ? { start, end } : null;
  };

  const getDays = (timeStr: string) => {
    const dayAbbr = timeStr.substring(0, 3).toUpperCase();
    const map: Record<string, string> = {
      'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday',
      'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
    };
    return map[dayAbbr] ? [map[dayAbbr]] : null;
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-12 text-center border border-border shadow-sm">
        <h3 className="text-foreground font-bold mb-1">No Schedule</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Schedule</h2>
          </div>
        </div>
      </div>

      <div className="bg-accent/50 border border-border rounded-xl p-3 flex items-start gap-3">
        <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-3 w-3" />
        </div>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
          Tap on any class to view full details and location.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[600px]">
          <thead>
            <tr className="bg-accent/50">
              <th className="w-14 py-2 border-b border-border"></th>
              {DAYS.map(day => (
                <th key={day} className="py-2 px-1 border-b border-border text-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{day.substring(0, 3)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const cellSpans: number[] = Array(DAYS.length).fill(0);
              return HOURS.map((hourStr, hIdx) => {
                const currentHour = 7 + hIdx;

                return (
                  <tr key={hourStr} className="h-10">
                    <td className="border-r border-b border-border text-center bg-accent/20">
                      <span className="text-[9px] font-bold text-muted-foreground tabular-nums">
                        {hourStr.split(' ')[0]}
                      </span>
                    </td>
                    
                    {DAYS.map((day, dayIdx) => {
                      if (cellSpans[dayIdx] > 0) {
                        cellSpans[dayIdx]--;
                        return null;
                      }

                      const classToRender = schedule.find(item => {
                        const days = getDays(item.time);
                        const range = parseTimeRange(item.time);
                        return days?.includes(day) && Math.floor(range?.start || 0) === currentHour;
                      });

                      if (classToRender) {
                        const range = parseTimeRange(classToRender.time);
                        const duration = range ? Math.ceil(range.end) - Math.floor(range.start) : 1;
                        if (duration > 1) cellSpans[dayIdx] = duration - 1;

                        return (
                          <td
                            key={day}
                            rowSpan={duration}
                            className="p-0.5 border-b border-l border-border align-top h-px"
                          >
                            <button
                              onClick={() => setSelectedItem(classToRender)}
                              className={`
                                w-full h-full rounded-lg p-1.5 flex flex-col items-center justify-center text-center
                                transition-all border ${getSubjectColor(classToRender.subject)}
                                shadow-sm hover:shadow-md active:opacity-70 overflow-hidden
                              `}
                            >
                              <span className="text-[10px] font-black leading-tight truncate w-full">
                                {getSubjectCode(classToRender.subject)}
                              </span>
                              {duration > 1 && (
                                <span className="text-[8px] font-bold opacity-60 mt-0.5 truncate w-full">
                                  {classToRender.room || '?'}
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      }

                      return <td key={day} className="border-b border-l border-border h-10"></td>;
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <div className="overflow-hidden">
            <div className={`p-5 ${getSubjectColor(selectedItem.subject)} border-b border-border/10`}>
              <div className="flex justify-between items-start mb-3">
                <div className="px-2 py-0.5 bg-background/20 dark:bg-black/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {selectedItem.section || '?'}
                </div>
              </div>
              <h3 className="text-lg font-bold leading-tight uppercase tracking-tight">
                {getSubjectName(selectedItem.subject) || '?'}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">
                {getSubjectCode(selectedItem.subject) || '?'}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Schedule</p>
                  <p className="text-sm font-bold text-foreground">{selectedItem.time || '?'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Room / Facility</p>
                  <p className="text-sm font-bold text-foreground">{selectedItem.room || '?'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Units</p>
                    <p className="text-xs font-bold text-foreground">{selectedItem.units || '?'} Units</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Section</p>
                    <p className="text-xs font-bold text-foreground">{selectedItem.section || '?'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={() => {
                    const code = getSubjectCode(selectedItem.subject);
                    router.push(`/subjects/${encodeURIComponent(code)}`);
                  }}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-sm shadow-primary/20"
                >
                  View Catalog
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2.5 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-accent/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
