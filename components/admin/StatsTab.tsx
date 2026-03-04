'use client';

import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Loader2, BarChart3, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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
  const [activeCourseIndex, setActiveCourseIndex] = useState<number | null>(null);

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
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Processing Registry Data...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare data for the chart
  const chartData = stats.courses.map(course => ({
    name: course.name.length > 15 ? course.name.substring(0, 15) + '...' : course.name,
    fullName: course.name,
    students: course.count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.fullName}</p>
          <p className="text-sm font-black text-primary">{payload[0].value} Students</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110">
            <Users className="h-16 w-16" />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Registry</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.totalStudents}</h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Live
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110">
            <GraduationCap className="h-16 w-16" />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Departments</p>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{stats.courses.length}</h3>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Most Students</p>
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-bold text-foreground truncate">{stats.courses[0]?.name}</span>
            </div>
        </div>

        {/* Main Analytics Container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Course Distribution Chart */}
        <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-sm font-black text-foreground uppercase tracking-tight">User Distribution</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">By Department</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 700 }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.4 }} />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'var(--primary)' : 'var(--muted-foreground)'} 
                      fillOpacity={index === 0 ? 1 : 0.3}
                      className="transition-all hover:fill-primary hover:fill-opacity-100"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Course Details</h4>
             <Filter className="h-3 w-3 text-muted-foreground" />
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.courses.map((course, idx) => (
              <div 
                key={idx}
                onMouseEnter={() => setActiveCourseIndex(idx)}
                onMouseLeave={() => setActiveCourseIndex(null)}
                className={`p-4 rounded-2xl border transition-all cursor-default ${
                  activeCourseIndex === idx 
                    ? 'bg-accent border-primary/20 shadow-md translate-x-1' 
                    : 'bg-card border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-foreground truncate leading-none mb-1 uppercase tracking-tight">
                      {course.name}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {course.count} Students
                    </p>
                  </div>
                  <div className="bg-primary/5 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                    {((course.count / stats.totalStudents) * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {course.yearLevels.map((yl, yIdx) => (
                    <div 
                      key={yIdx}
                      className="text-[8px] font-black px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground uppercase tracking-tighter"
                    >
                      {yl.level}: <span className="text-primary">{yl.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
