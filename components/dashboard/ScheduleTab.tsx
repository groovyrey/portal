'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleItem, Student } from '@/types';
import ScheduleTable from './ScheduleTable';
import UpcomingHolidays from './UpcomingHolidays';

interface ScheduleTabProps {
  schedule: ScheduleItem[];
}

export default function ScheduleTab({ schedule }: ScheduleTabProps) {
  const [holidays, setHolidays] = useState<any[]>([]);

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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ScheduleTable 
             schedule={schedule} 
             holidays={holidays}
           />
        </div>
        <div className="lg:col-span-1">
          <UpcomingHolidays />
        </div>
      </div>
    </div>
  );
}
