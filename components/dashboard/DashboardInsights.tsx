'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Student, ScheduleItem } from '@/types';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  Zap,
  TrendingUp,
  CreditCard,
  ArrowRight,
  PartyPopper
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardInsightsProps {
  student: Student;
}

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DashboardInsights({ student }: DashboardInsightsProps) {
  const schedule = student.schedule || [];
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

  // Calculate Upcoming Holidays (Top 3)
  const upcomingHolidays = useMemo(() => {
    if (holidays.length === 0) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return holidays
      .filter(h => new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [holidays]);
  
  // 1. Calculate Next Class
  const nextClass = useMemo(() => {
    if (schedule.length === 0) return null;
    
    const now = new Date();
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // 0 is Sunday
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
          'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday',
          'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
        };
        return map[dayAbbr];
    };

    // Filter classes for today that haven't started yet
    const todayClasses = schedule.filter(item => {
        const day = getDayFromTime(item.time);
        const timeRange = item.time.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
        if (!timeRange || day !== currentDay) return false;
        
        const startTime = parseTime(timeRange[1]);
        return startTime !== null && startTime > currentHour;
    });

    if (todayClasses.length === 0) return null;

    // Sort by start time and pick the first one
    return todayClasses.sort((a, b) => {
        const startA = parseTime(a.time.match(/(\d+:\d+\s*(?:AM|PM))/i)?.[1] || '12:00 AM') || 0;
        const startB = parseTime(b.time.match(/(\d+:\d+\s*(?:AM|PM))/i)?.[1] || '12:00 AM') || 0;
        return startA - startB;
    })[0];
  }, [schedule]);

  // 2. Weekly Load Analysis
  const weeklyLoad = useMemo(() => {
    const load: Record<string, number> = {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
    };

    schedule.forEach(item => {
        const dayAbbr = item.time.substring(0, 3).toUpperCase();
        const map: Record<string, string> = {
          'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 'THU': 'Thursday',
          'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
        };
        const day = map[dayAbbr];
        if (day) {
            const timeRange = item.time.match(/(\d+:\d+\s*(?:AM|PM))\s*-\s*(\d+:\d+\s*(?:AM|PM))/i);
            if (timeRange) {
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
            }
        }
    });

    return load;
  }, [schedule]);

  const maxLoad = Math.max(...Object.values(weeklyLoad), 1);

  // 3. Academic Stats
  const totalUnits = useMemo(() => {
    return schedule.reduce((acc, item) => acc + (parseFloat(item.units) || 0), 0);
  }, [schedule]);

  // 4. Financial Progress
  const financialProgress = useMemo(() => {
    if (!student.financials) return null;
    const total = parseFloat(student.financials.total.replace(/[^\d.-]/g, '')) || 0;
    const balance = parseFloat(student.financials.balance.replace(/[^\d.-]/g, '')) || 0;
    if (total === 0) return 0;
    return Math.round(((total - balance) / total) * 100);
  }, [student.financials]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Next Class Spotlight */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-primary rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Zap size={80} />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-primary-foreground/20 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Next Class</span>
          </div>

          {nextClass ? (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-black leading-tight break-words uppercase tracking-tight">
                  {nextClass.subject.split(' - ')[0]}
                </h3>
                <p className="text-xs font-bold text-primary-foreground/70 break-words mt-1">
                  {nextClass.subject.split(' - ')[1] || 'Lecture'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  {nextClass.time.split('-')[0].trim()}
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 opacity-60" />
                  {nextClass.room}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-lg font-black uppercase tracking-tight">No more classes</p>
              <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest mt-1">Enjoy your break!</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-primary-foreground/10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</span>
              <span className="px-2 py-0.5 bg-primary-foreground/20 rounded text-[9px] font-black uppercase tracking-wider">
                {nextClass ? 'Upcoming' : 'Free Time'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Weekly Workload Graph */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col group"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent rounded-lg text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weekly Load</span>
          </div>
          <span className="text-[10px] font-black text-foreground">{Math.round(Object.values(weeklyLoad).reduce((a,b)=>a+b, 0))} hrs / wk</span>
        </div>

        <div className="flex-1 flex items-end justify-between gap-2 h-24">
          {DAYS.map(day => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2 group/bar">
              <div className="w-full relative bg-accent rounded-t-lg overflow-hidden h-24">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(weeklyLoad[day] / maxLoad) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`absolute bottom-0 left-0 right-0 bg-primary/40 group-hover/bar:bg-primary transition-colors ${
                    day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ? 'bg-primary' : ''
                  }`}
                />
              </div>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. Academic & Financial Pulse */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between group"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent rounded-lg text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Stats</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Enrolled Subjects</p>
              <p className="text-xl font-black text-foreground">{schedule.length}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Units</p>
              <p className="text-xl font-black text-foreground">{totalUnits}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Progress</span>
              </div>
              <span className="text-[10px] font-black text-primary">{financialProgress}%</span>
            </div>
            <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${financialProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>

        <button className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-accent hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
          Academic Report <ArrowRight size={12} />
        </button>
      </motion.div>

      {/* 4. Upcoming Holidays List */}
      {upcomingHolidays.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 shadow-sm group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <PartyPopper size={16} />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Upcoming Holidays
            </h3>
          </div>

          <div className="space-y-3">
            {upcomingHolidays.map((holiday, idx) => {
              const daysLeft = Math.ceil((new Date(holiday.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
              const isToday = daysLeft === 0;

              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors"
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
        </motion.div>
      )}
    </div>
  );
}
