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
  'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
  'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100',
  'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
  'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100',
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
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
        <h3 className="text-slate-900 font-bold mb-1">No Schedule</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Class Schedule</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Weekly Overview</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex items-start gap-3">
        <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Info className="h-3.5 w-3.5" />
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Pro-tip:</span> Tap or click on any class in the schedule to view full subject details, room location, and section information.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="w-14 py-2 border-b border-slate-100"></th>
              {DAYS.map(day => (
                <th key={day} className="py-2 px-1 border-b border-slate-100 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.substring(0, 3)}</span>
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
                    <td className="border-r border-b border-slate-50 text-center bg-slate-50/30">
                      <span className="text-[9px] font-bold text-slate-400 tabular-nums">
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
                            className="p-0.5 border-b border-l border-slate-50 align-top h-px"
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

                      return <td key={day} className="border-b border-l border-slate-50 h-10"></td>;
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <div className="overflow-hidden">
            <div className={`p-6 ${getSubjectColor(selectedItem.subject)} border-b border-black/5`}>
              <div className="flex justify-between items-start mb-4">
                <div className="px-2 py-1 bg-white/40 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {selectedItem.section || '?'}
                </div>
              </div>
              <h3 className="text-lg font-black leading-tight mb-2 uppercase tracking-tight">
                {getSubjectName(selectedItem.subject) || '?'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                  {getSubjectCode(selectedItem.subject) || '?'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Schedule</p>
                  <p className="text-sm font-bold text-slate-700">{selectedItem.time || '?'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room / Facility</p>
                  <p className="text-sm font-bold text-slate-700">{selectedItem.room || '?'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Units</p>
                    <p className="text-xs font-bold text-slate-700">{selectedItem.units || '?'} Units</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section</p>
                    <p className="text-xs font-bold text-slate-700">{selectedItem.section || '?'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={() => {
                    const code = getSubjectCode(selectedItem.subject);
                    router.push(`/subjects/${encodeURIComponent(code)}`);
                  }}
                  className="w-full py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                >
                  View Catalog Info
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
