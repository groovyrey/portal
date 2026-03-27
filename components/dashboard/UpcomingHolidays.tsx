'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PartyPopper } from 'lucide-react';

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

export default function UpcomingHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    async function fetchHolidays() {
      try {
        const year = new Date().getFullYear();
        const response = await fetch(`/api/student/holidays?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          setHolidays(data);
        }
      } catch (e) {
        console.error('Failed to fetch holidays', e);
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
      .slice(0, 3);
  }, [holidays]);

  if (upcomingHolidays.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <PartyPopper size={16} />
        </div>
        <h3 className="text-sm font-medium">Upcoming holidays</h3>
      </div>

      <div className="space-y-3">
        {upcomingHolidays.map((holiday, idx) => {
          const daysLeft = Math.ceil((new Date(holiday.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
          const isToday = daysLeft === 0;

          return (
            <div 
              key={idx}
              className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <div className="flex items-center gap-4">
                <div className={`flex flex-col items-center justify-center h-10 w-10 rounded-lg border ${isToday ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-background border-border text-muted-foreground'}`}>
                  <span className="text-[8px] font-black uppercase leading-none">
                    {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-sm font-black leading-none mt-0.5">
                    {new Date(holiday.date).getDate()}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {holiday.localName || holiday.name}
                  </h4>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-emerald-600' : 'text-muted-foreground/60'}`}>
                {isToday ? 'Today' : `${daysLeft} days`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
