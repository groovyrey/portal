'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, GraduationCap, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CourseYearLevel {
  level: string;
  count: number;
}

interface CourseStat {
  name: string;
  count: number;
  yearLevels: CourseYearLevel[];
}

interface StatsResponse {
  totalStudents: number;
  courses: CourseStat[];
}

export default function StatsTab() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = (await response.json()) as {
          success: boolean;
          stats?: StatsResponse;
          error?: string;
        };

        if (!data.success || !data.stats) {
          toast.error(data.error || 'Failed to fetch stats');
          return;
        }

        setStats(data.stats);
      } catch {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const sortedCourses = useMemo(() => {
    if (!stats) return [];
    return [...stats.courses].sort((a, b) => b.count - a.count);
  }, [stats]);

  const chartData = useMemo(
    () =>
      sortedCourses.map((course) => ({
        name: course.name.length > 18 ? `${course.name.slice(0, 18)}...` : course.name,
        count: course.count,
      })),
    [sortedCourses]
  );

  if (loading) {
    return (
      <div className="min-h-[260px] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mb-3" />
        <p className="text-[11px] font-bold uppercase tracking-wider">Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center text-sm text-muted-foreground font-medium">
        Unable to load statistics.
      </div>
    );
  }

  const topCourse = sortedCourses[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Total Students</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{stats.totalStudents}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Departments</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{stats.courses.length}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Largest Program</p>
          </div>
          <p className="text-lg font-semibold leading-tight line-clamp-1">
            {topCourse ? topCourse.name : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="mb-6">
          <h3 className="text-sm font-semibold">Student Distribution</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Enrollment count by course</p>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 52 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} 
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  fontSize: 12,
                }}
                cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-sm font-semibold">Course Breakdown</h3>
        </div>

        <div className="divide-y divide-border">
          {sortedCourses.map((course) => {
            const percentage = stats.totalStudents > 0 ? (course.count / stats.totalStudents) * 100 : 0;
            return (
              <div key={course.name} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{course.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{course.count} students</p>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {course.yearLevels.map((item) => (
                    <div key={`${course.name}-${item.level}`} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.level}</p>
                      <p className="text-xs font-semibold mt-0.5">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
