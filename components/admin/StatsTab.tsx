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

  // Prepare data for the chart - Vertical bars can be hard to read with many courses
  // We'll use more space and better labels
  const chartData = stats.courses.map(course => ({
    name: course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name,
    fullName: course.name,
    students: course.count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-xl backdrop-blur-md z-50">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.fullName}</p>
          <p className="text-sm font-black text-primary">{payload[0].value} Students</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
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
                <span className="text-xs font-bold text-foreground break-words">{stats.courses[0]?.name}</span>            </div>
        </div>
      </div>

      {/* Main Analytics Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Distribution Chart - Now spanning full width for better visibility */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="text-base font-black text-foreground uppercase tracking-tight">User Distribution</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Enrollment by Department</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Top Course</span>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground/30" />
            </div>
          </div>

          <div className="h-[450px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="horizontal"
                margin={{ top: 0, right: 20, left: -10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ fill: 'var(--accent)', opacity: 0.4 }} 
                    wrapperStyle={{ outline: 'none' }}
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} barSize={40}>
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

        {/* Detailed List and Breakdown - Side by side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.courses.map((course, idx) => (
              <div 
                key={idx}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-6 border-b border-border bg-accent/20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h5 className="text-sm font-black text-foreground uppercase tracking-tight leading-tight mb-1">
                                {course.name}
                            </h5>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{course.count} Total Students</span>
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <span className="text-[10px] font-black text-primary uppercase">{((course.count / stats.totalStudents) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-accent/10 border-b border-border">
                                <th className="px-6 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Year Level</th>
                                <th className="px-6 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right">Student Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {course.yearLevels.map((yl, yIdx) => (
                                <tr key={yIdx} className="hover:bg-accent/30 transition-colors">
                                    <td className="px-6 py-3 text-xs font-bold text-foreground uppercase">{yl.level}</td>
                                    <td className="px-6 py-3 text-xs font-black text-primary text-right">{yl.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-accent/5 mt-auto border-t border-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Distribution Weight</span>
                        <span className="text-[9px] font-black text-foreground uppercase tracking-widest">{((course.count / stats.totalStudents) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(course.count / stats.totalStudents) * 100}%` }}
                            transition={{ duration: 1, delay: idx * 0.05 }}
                            className="h-full bg-primary rounded-full"
                        />
                    </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
