'use client';

import React, { useMemo } from 'react';
import { Student } from '@/types';
import { Clock, Calendar, BookOpen, TrendingUp, CreditCard, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardInsightsProps {
  student: Student;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DashboardInsights({ student }: DashboardInsightsProps) {
  const schedule = useMemo(() => student.schedule || [], [student.schedule]);

  const nextClass = useMemo(() => {
    if (schedule.length === 0) return null;

    const now = new Date();
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const currentHour = now.getHours() + now.getMinutes() / 60;

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

    const getDayFromTime = (timeStr: string) => {
      const dayAbbr = timeStr.substring(0, 3).toUpperCase();
      const map: Record<string, string> = {
        MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
        FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
      };
      return map[dayAbbr];
    };

    const todayClasses = schedule.filter((item) => {
      const day = getDayFromTime(item.time);
      const timeRange = item.time.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
      if (!timeRange || day !== currentDay) return false;
      const startTime = parseTime(timeRange[1]);
      return startTime !== null && startTime > currentHour;
    });

    if (todayClasses.length === 0) return null;

    return todayClasses.sort((a, b) => {
      const startA = parseTime(a.time.match(/(\d+:\d+\s*(?:AM|PM))/i)?.[1] || '12:00 AM') || 0;
      const startB = parseTime(b.time.match(/(\d+:\d+\s*(?:AM|PM))/i)?.[1] || '12:00 AM') || 0;
      return startA - startB;
    })[0];
  }, [schedule]);

  const weeklyLoad = useMemo(() => {
    const load: Record<string, number> = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
    };

    schedule.forEach((item) => {
      const dayAbbr = item.time.substring(0, 3).toUpperCase();
      const map: Record<string, string> = {
        MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
        FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
      };
      const day = map[dayAbbr];
      if (!day) return;

      const timeRange = item.time.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
      if (!timeRange) return;

      const parseTime = (t: string) => {
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hour !== 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        return hour + minute / 60;
      };

      const duration = parseTime(timeRange[2]) - parseTime(timeRange[1]);
      load[day] += duration;
    });

    return load;
  }, [schedule]);

  const maxLoad = Math.max(...Object.values(weeklyLoad), 1);
  const totalUnits = useMemo(() => {
    return schedule.reduce((acc, item) => acc + (parseFloat(item.units) || 0), 0);
  }, [schedule]);

  const financialProgress = useMemo(() => {
    if (!student.financials) return 0;
    const total = parseFloat(student.financials.total.replace(/[^\d.-]/g, '')) || 0;
    const balance = parseFloat(student.financials.balance.replace(/[^\d.-]/g, '')) || 0;
    if (total === 0) return 0;
    return Math.round(((total - balance) / total) * 100);
  }, [student.financials]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Up Next</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nextClass ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold leading-none">{nextClass.subject.split(' - ')[0]}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{nextClass.subject.split(' - ')[1] || 'Class'}</p>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-2 h-3.5 w-3.5" />
                  {nextClass.time.split('-')[0].trim()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <BookOpen className="mr-2 h-3.5 w-3.5" />
                  {nextClass.room || 'TBA'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm font-medium">No more classes</p>
              <p className="text-xs text-muted-foreground mt-1">Relax!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Weekly Load</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex h-20 items-end gap-1.5">
            {DAYS.map((day) => {
              const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              const isToday = day === DAYS[todayIndex];
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative h-16 w-full overflow-hidden rounded-sm bg-muted">
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all",
                        isToday ? "bg-primary" : "bg-primary/40"
                      )}
                      style={{ height: `${(weeklyLoad[day] / maxLoad) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">{day.slice(0, 1)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center font-medium">
            Total: {Math.round(Object.values(weeklyLoad).reduce((a, b) => a + b, 0))} hrs / week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Finances</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Paid</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{financialProgress}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Units</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{totalUnits}</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase">
                <span>Progress</span>
                <span>{financialProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${financialProgress}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
