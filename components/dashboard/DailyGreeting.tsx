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

  const Icon = timeOfDay === 'morning' ? Sun : timeOfDay === 'afternoon' ? Cloud : Moon;
  const iconColor = timeOfDay === 'morning' ? 'text-amber-500' : timeOfDay === 'afternoon' ? 'text-blue-500' : 'text-indigo-500';

  const firstName = student.parsedName?.firstName || student.name.split(' ')[0];
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(currentDate);

  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground leading-none">
                Good {timeOfDay},
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">{firstName}</h2>
              <p className="text-xs font-medium text-muted-foreground mt-1 line-clamp-1">
                {student.course}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {dayName}
            </div>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">Year {student.yearLevel || '?'}</span>
              <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{student.semester || '?'}</span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{student.schoolYear || '?'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
