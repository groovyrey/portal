'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Skeleton from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

export default function UpcomingHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHolidays() {
      setLoading(true);
      try {
        const year = new Date().getFullYear();
        const response = await fetch(`/api/student/holidays?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          setHolidays(data);
        }
      } catch (e) {
        console.error('Failed to fetch holidays', e);
      } finally {
        setLoading(false);
      }
    }
    fetchHolidays();
  }, []);

  const upcomingHolidays = useMemo(() => {
    if (holidays.length === 0) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return holidays
      .filter(h => new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [holidays]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (upcomingHolidays.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4 flex flex-row items-center gap-2 space-y-0">
        <PartyPopper className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">Holidays</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingHolidays.map((holiday, idx) => {
          const holidayDate = new Date(holiday.date);
          const daysLeft = Math.ceil((holidayDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
          const isToday = daysLeft === 0;

          return (
            <div 
              key={idx}
              className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex flex-col items-center justify-center h-10 w-10 rounded-md border text-center",
                  isToday ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                )}>
                  <span className="text-[8px] font-bold uppercase leading-none">
                    {holidayDate.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-sm font-bold leading-none mt-0.5">
                    {holidayDate.getDate()}
                  </span>
                </div>
                
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold truncate">
                    {holiday.localName || holiday.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {holidayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              
              <Badge variant={isToday ? "default" : "secondary"} className="text-[10px] shrink-0">
                {isToday ? 'Today' : `${daysLeft}d`}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
