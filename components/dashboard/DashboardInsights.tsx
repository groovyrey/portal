'use client';

import React, { useMemo } from 'react';
import { Student } from '@/types';
import { Clock, Calendar, BookOpen, TrendingUp, CreditCard } from 'lucide-react';

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
        MON: 'Monday',
        TUE: 'Tuesday',
        WED: 'Wednesday',
        THU: 'Thursday',
        FRI: 'Friday',
        SAT: 'Saturday',
        SUN: 'Sunday'
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
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    };

    schedule.forEach((item) => {
      const dayAbbr = item.time.substring(0, 3).toUpperCase();
      const map: Record<string, string> = {
        MON: 'Monday',
        TUE: 'Tuesday',
        WED: 'Wednesday',
        THU: 'Thursday',
        FRI: 'Friday',
        SAT: 'Saturday',
        SUN: 'Sunday'
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
      <section className="surface-sky relative overflow-hidden rounded-lg border border-border/80 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-400/5" />
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Next class</p>
        </div>

        {nextClass ? (
          <>
            <h3 className="text-lg font-semibold leading-tight">{nextClass.subject.split(' - ')[0]}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{nextClass.subject.split(' - ')[1] || 'Lecture'}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {nextClass.time.split('-')[0].trim()}
              </p>
              <p className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {nextClass.room || 'TBA'}
              </p>
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-lg font-semibold">No more classes today</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enjoy your break.</p>
          </div>
        )}
      </section>

      <section className="surface-emerald relative overflow-hidden rounded-lg border border-border/80 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Weekly load</p>
          </div>
          <p className="text-xs text-muted-foreground">{Math.round(Object.values(weeklyLoad).reduce((a, b) => a + b, 0))} hrs</p>
        </div>

        <div className="flex h-24 items-end gap-2">
          {DAYS.map((day) => {
            const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
            const isToday = day === DAYS[todayIndex];
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative h-20 w-full overflow-hidden rounded-sm bg-muted/50">
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${isToday ? 'bg-primary' : 'bg-primary/50'}`}
                    style={{ height: `${(weeklyLoad[day] / maxLoad) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{day.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-amber relative overflow-hidden rounded-lg border border-border/80 p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-400/5" />
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Quick stats</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-xl font-semibold">{schedule.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Units</p>
            <p className="text-xl font-semibold">{totalUnits}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Payment progress</p>
            <p className="text-xs font-medium">{financialProgress}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${financialProgress}%` }} />
          </div>
        </div>
      </section>
    </div>
  );
}
