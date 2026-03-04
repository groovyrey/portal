'use client';

import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Loader2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CourseStat {
  name: string;
  count: number;
  yearLevels: { level: string; count: number }[];
}

interface Stats {
  totalStudents: number;
  courses: CourseStat[];
}

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          toast.error(data.error || 'Failed to fetch stats');
        }
      } catch (err) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calculating Metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Students</p>
              <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.totalStudents}</h3>
            </div>
          </div>
          <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full w-full opacity-20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Courses</p>
              <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.courses.length}</h3>
            </div>
          </div>
          <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full w-full opacity-20" />
          </div>
        </div>
      </div>

      {/* Course Breakdown */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-accent/30 flex items-center justify-between">
          <div>
            <h4 className="font-black text-foreground uppercase tracking-tight">Course Breakdown</h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Enrollment by Department</p>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {stats.courses.map((course, idx) => {
              const percentage = ((course.count / stats.totalStudents) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-3 p-4 rounded-xl border border-border bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-foreground truncate max-w-[70%]">{course.name}</span>
                    <span className="text-muted-foreground">{course.count} Students ({percentage}%)</span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>

                  {/* Year Levels Breakdown */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {course.yearLevels.map((yl, yIdx) => (
                      <div 
                        key={yIdx} 
                        className="px-2 py-1 rounded-lg bg-card border border-border flex items-center gap-2"
                      >
                        <span className="text-[9px] font-black text-muted-foreground uppercase">{yl.level}</span>
                        <div className="h-3 w-[1px] bg-border" />
                        <span className="text-[9px] font-black text-primary">{yl.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
