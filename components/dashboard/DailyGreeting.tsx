'use client';

import { Student } from '@/types';
import { Cloud, Sun, Moon, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DailyGreeting({ student }: { student: Student }) {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    const timer = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const themes = {
    morning: {
      icon: Sun,
      iconColor: 'text-amber-500',
      gradient: 'from-amber-200/50 via-orange-100/30 to-background dark:from-amber-500/20 dark:via-orange-500/10 dark:to-background',
      glow: 'bg-amber-400/20 dark:bg-amber-500/10',
    },
    afternoon: {
      icon: Cloud,
      iconColor: 'text-blue-500',
      gradient: 'from-sky-200/50 via-blue-100/30 to-background dark:from-sky-500/20 dark:via-blue-500/10 dark:to-background',
      glow: 'bg-sky-400/20 dark:bg-sky-500/10',
    },
    evening: {
      icon: Moon,
      iconColor: 'text-indigo-500',
      gradient: 'from-indigo-200/50 via-violet-100/30 to-background dark:from-indigo-500/20 dark:via-violet-500/10 dark:to-background',
      glow: 'bg-indigo-400/20 dark:bg-indigo-500/10',
    },
  }[timeOfDay];

  const Icon = themes.icon;

  const firstName = student.parsedName?.firstName || student.name.split(' ')[0];
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(currentDate);

  const infoRows = [
    { label: 'Year Level', value: student.yearLevel || '?' },
    { label: 'Semester', value: student.semester || '?' },
    ...(student.section ? [{ label: 'Section', value: student.section }] : []),
    { label: 'School Year', value: student.schoolYear || '?' },
  ];

  return (
    <Card className={cn('relative overflow-hidden border-none shadow-sm bg-gradient-to-br', themes.gradient)}>
      {/* Decorative glows */}
      <div className={cn('absolute -top-12 -right-12 h-44 w-44 rounded-full blur-3xl pointer-events-none', themes.glow)} />
      <div className={cn('absolute -bottom-16 -left-10 h-40 w-40 rounded-full blur-3xl pointer-events-none opacity-70', themes.glow)} />

      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/60 dark:bg-background/40 text-primary shadow-sm">
              <Icon className={`h-6 w-6 ${themes.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground leading-none">
                Good {timeOfDay},
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-1 truncate">{firstName}</h2>
              <div className="mt-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Course</p>
                <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-1">{student.course || '—'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {dayName}
            </div>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 sm:max-w-md lg:max-w-none lg:w-auto lg:flex lg:flex-col lg:items-end gap-y-1.5 gap-x-8">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between lg:justify-end gap-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
