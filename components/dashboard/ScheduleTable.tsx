'use client';

import { ScheduleItem } from '@/types';
import React, { useState, useMemo, useRef } from 'react';
import { MapPin, Clock, Hash, BookOpen, Info, Calendar, ArrowRight, Download, Camera, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  holidays?: any[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM', '9:00 PM'
];

export default function ScheduleTable({ schedule, holidays = [] }: ScheduleTableProps) {
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const tableRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const currentDay = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Asia/Manila' 
    });
  }, []);

  const weekHolidays = useMemo(() => {
    if (!holidays.length) return {};
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const mapped: Record<string, any> = {};
    holidays.forEach(h => {
      const hDate = new Date(h.date);
      if (hDate >= startOfWeek) {
        const dayName = hDate.toLocaleDateString('en-US', { weekday: 'long' });
        mapped[dayName] = h;
      }
    });
    return mapped;
  }, [holidays]);

  const downloadImage = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    const downloadToast = toast.loading('Saving image...');

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

      const canvas = await (window as any).html2canvas(tableRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Schedule.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Saved!', { id: downloadToast });
    } catch (err) {
      toast.error('Failed to save', { id: downloadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const getSubjectCode = (subject: string) => subject.split(' - ')[0].trim();
  const getSubjectName = (subject: string) => {
    const parts = subject.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : subject;
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
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => (parseTimeRange(a.time)?.start || 0) - (parseTimeRange(b.time)?.start || 0));
    });
    return grouped;
  }, [schedule]);

  if (!schedule || schedule.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-muted-foreground">No classes scheduled yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold tracking-tight">Schedule</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadImage}
            disabled={isExporting}
          >
            {isExporting ? <Camera className="mr-2 h-4 w-4 animate-pulse" /> : <Download className="mr-2 h-4 w-4" />}
            Save Image
          </Button>
        </div>
      </div>

      <div id="schedule-capture-area" ref={tableRef} className="rounded-md border bg-card overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[700px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="w-16 py-3 border-b text-xs font-medium text-muted-foreground uppercase">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className={cn(
                      "py-3 border-b text-center text-xs font-medium uppercase transition-colors",
                      day === currentDay ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                      {day.substring(0, 3)}
                      {day === currentDay && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-primary" />}
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
                      <tr key={hourStr} className="group">
                        <td className="border-r border-b text-center py-2 bg-muted/20">
                          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
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
                                className={cn(
                                  "p-1 border-b border-l align-top transition-colors",
                                  day === currentDay && "bg-primary/5"
                                )}
                              >
                                <button
                                  onClick={() => setSelectedItem(classToRender)}
                                  className="w-full h-full rounded-md p-2 flex flex-col items-center justify-center text-center bg-secondary hover:bg-secondary/80 transition-colors relative"
                                >
                                  <span className="text-[10px] font-semibold leading-tight line-clamp-2">
                                    {getSubjectCode(classToRender.subject)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground mt-1 font-medium">
                                    {classToRender.room || 'TBA'}
                                  </span>
                                </button>
                              </td>
                            );
                          }

                          return (
                            <td key={day} className={cn(
                              "border-b border-l h-12 transition-colors",
                              day === currentDay && "bg-primary/5"
                            )} />
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y">
            {DAYS.map(day => {
              const dayClasses = groupedSchedule[day] || [];
              const isToday = day === currentDay;
              if (dayClasses.length === 0) return null;

              return (
                <div key={day} className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "text-sm font-semibold uppercase tracking-wider",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {day}
                    </h3>
                    {isToday && <Badge variant="secondary" className="text-[10px] h-4">Today</Badge>}
                  </div>

                  <div className="grid gap-2">
                    {dayClasses.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedItem(item)}
                        className="flex items-center gap-4 p-4 rounded-md border bg-card hover:bg-accent transition-colors text-left group"
                      >
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-md bg-muted text-muted-foreground group-hover:bg-background transition-colors">
                          <Clock className="h-4 w-4 mb-1" />
                          <span className="text-[10px] font-bold">
                            {item.time.split(' - ')[0].split(' ')[1]}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-primary mb-0.5">
                            {getSubjectCode(item.subject)}
                          </div>
                          <h4 className="text-sm font-medium line-clamp-1">
                            {getSubjectName(item.subject)}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.time.split(' - ')[0]} - {item.time.split(' - ')[1]}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.room || 'TBA'}
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? getSubjectName(selectedItem.subject) : undefined}
      >
        {selectedItem && (
          <div className="space-y-6 -mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[10px] py-0">{getSubjectCode(selectedItem.subject)}</Badge>
              <Badge variant="outline" className="text-[10px] py-0 border-primary/20 text-primary bg-primary/5">Section {selectedItem.section || 'TBA'}</Badge>
            </div>

            <div className="grid gap-5">
              <div className="flex items-start gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time Schedule</p>
                  <p className="text-sm font-semibold leading-tight">{selectedItem.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location / Room</p>
                  <p className="text-sm font-semibold leading-tight">{selectedItem.room || 'TBA'}</p>
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid gap-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units</p>
                    <p className="text-sm font-bold">{selectedItem.units || '0'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid gap-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section</p>
                    <p className="text-sm font-bold">{selectedItem.section || 'TBA'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setSelectedItem(null)} 
              className="w-full mt-2 rounded-xl h-11 font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-accent"
            >
              Dismiss
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
