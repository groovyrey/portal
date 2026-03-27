'use client';

import React from 'react';
import { ScheduleItem, Student } from '@/types';
import ScheduleTable from './ScheduleTable';
import UpcomingHolidays from './UpcomingHolidays';

interface ScheduleTabProps {
  schedule: ScheduleItem[];
  offeredSubjects?: Student['offeredSubjects'];
}

export default function ScheduleTab({ schedule, offeredSubjects }: ScheduleTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <ScheduleTable 
             schedule={schedule} 
             offeredSubjects={offeredSubjects} 
           />
        </div>
        <div className="lg:col-span-1">
          <UpcomingHolidays />
        </div>
      </div>
    </div>
  );
}
