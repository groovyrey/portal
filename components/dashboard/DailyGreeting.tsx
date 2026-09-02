'use client';

import { Student } from '@/types';
import { Cloud, Sun, Moon, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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

  const icons = { morning: Sun, afternoon: Cloud, evening: Moon };
  const Icon = icons[timeOfDay];

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
    <Card className="border-border">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">
                Good {timeOfDay},
              </p>
              <h2 className="text-lg font-bold tracking-tight mt-0.5 truncate">{firstName}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{student.course || '---'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {dayName}, {formattedDate}
            </div>
            <div className="w-full grid grid-cols-2 sm:max-w-md lg:max-w-none lg:w-auto lg:flex lg:flex-col lg:items-end gap-y-1 gap-x-6">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between lg:justify-end gap-3 text-[11px]">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
