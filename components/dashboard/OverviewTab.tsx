'use client';

import React from 'react';
import { Student } from '@/types';
import DailyGreeting from './DailyGreeting';
import StatCards from './StatCards';
import DashboardInsights from './DashboardInsights';

interface OverviewTabProps {
  student: Student;
}

export default function OverviewTab({ student }: OverviewTabProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <DailyGreeting student={student} />
      
      <StatCards student={student} />
      
      <DashboardInsights student={student} />
    </div>
  );
}
