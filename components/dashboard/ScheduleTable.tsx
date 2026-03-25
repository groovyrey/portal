'use client';

import { ScheduleItem, ProspectusSubject } from '@/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { X, MapPin, Clock, Hash, BookOpen, Info, Calendar, ArrowRight, Download, Camera } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  const tableRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadImage = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    const downloadToast = toast.loading('Generating schedule image...');

    try {
      if (!(window as any).html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // 1. Calculate the natural width of the content
      const table = tableRef.current.querySelector('table');
      const actualWidth = table ? Math.max(table.scrollWidth, 800) : 1000; 
      const actualHeight = tableRef.current.scrollHeight;

      // 2. Capture with the natural calculated width
      const canvas = await (window as any).html2canvas(tableRef.current, {
        backgroundColor: '#020617',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: actualWidth,
        height: actualHeight,
        windowWidth: actualWidth, 
        onclone: (clonedDoc: Document) => {
          const clonedArea = clonedDoc.getElementById('schedule-capture-area');
          if (clonedArea) {
            clonedArea.style.width = `${actualWidth}px`;
            clonedArea.style.height = 'auto';
            clonedArea.style.overflow = 'visible';

            const clonedScroll = clonedArea.querySelector('.overflow-x-auto');
            if (clonedScroll) {
              (clonedScroll as HTMLElement).style.overflow = 'visible';
              (clonedScroll as HTMLElement).style.width = '100%';
            }

            const clonedTable = clonedArea.querySelector('table');
            if (clonedTable) {
              clonedTable.style.width = '100%';
              clonedTable.style.minWidth = `${actualWidth}px`;
              clonedTable.style.tableLayout = 'fixed';
            }

            // Still remove truncation to prevent text being cut off horizontally
            const subjectButtons = clonedArea.querySelectorAll('button');
            subjectButtons.forEach(btn => {
              btn.style.overflow = 'visible';
              btn.style.whiteSpace = 'normal';
              btn.style.padding = '4px';
              
              const spans = btn.querySelectorAll('span');
              spans.forEach(span => {
                span.style.overflow = 'visible';
                span.style.textOverflow = 'clip';
                span.style.whiteSpace = 'normal';
                span.classList.remove('truncate');
              });
            });
          }

          // Fix for modern CSS color functions not supported by html2canvas
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            if (style.backgroundColor.includes('okl')) {
               el.style.backgroundColor = '#0f172a';
            }
            if (style.color.includes('okl')) {
               el.style.color = '#f8fafc';
            }
            if (style.borderColor.includes('okl')) {
               el.style.borderColor = '#1e293b';
            }
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `LCC-Schedule-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Schedule saved successfully!', { id: downloadToast });
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to generate image. Please try again.', { id: downloadToast });
    } finally {
      setIsExporting(false);
    }
  };

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

  const groupedSchedule = useMemo(() => {
    const grouped: Record<string, ScheduleItem[]> = {};
    
    schedule.forEach(item => {
      const days = getDays(item.time);
      if (days) {
        days.forEach(day => {
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(item);
        });
      }
    });

    // Sort by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = parseTimeRange(a.time)?.start || 0;
        const timeB = parseTimeRange(b.time)?.start || 0;
        return timeA - timeB;
      });
    });

    return grouped;
  }, [schedule]);

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

        <button
          onClick={downloadImage}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          title="Save as Image"
        >
          {isExporting ? <Camera className="h-3.5 w-3.5 animate-pulse" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Save Image</span>
        </button>
      </div>

      <div className="bg-accent/50 border border-border rounded-xl p-3 flex items-start gap-3">
        <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-3 w-3" />
        </div>
        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
          Tap on any class to view full details and location.
        </p>
      </div>

      <div id="schedule-capture-area" ref={tableRef} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr className="bg-accent/50">
              <th className="w-10 sm:w-14 py-2 border-b border-border"></th>
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
                    <td className="border-r border-b border-border text-center bg-accent/10">
                      {hIdx % 2 === 0 && (
                        <span className="text-[9px] font-black text-muted-foreground/60 tabular-nums uppercase tracking-tighter">
                          {hourStr.split(':')[0]} {hourStr.split(' ')[1]}
                        </span>
                      )}
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
                                shadow-sm hover:shadow-md active:opacity-70 overflow-hidden whitespace-normal
                              `}
                            >
                              <span className="text-[10px] font-black leading-tight break-words w-full">
                                {getSubjectCode(classToRender.subject)}
                              </span>
                              {duration > 1 && (
                                <span className="text-[8px] font-bold opacity-60 mt-0.5 break-words w-full">
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
                <div className="px-2 py-0.5 bg-muted rounded-md text-[10px] font-bold uppercase tracking-wider">
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
