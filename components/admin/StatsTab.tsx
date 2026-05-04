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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
        name: course.name.length > 20 ? `${course.name.slice(0, 20)}...` : course.name,
        count: course.count,
      })),
    [sortedCourses]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Gathering analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-12 text-center text-muted-foreground bg-muted/20 border-dashed">
        <p className="text-sm font-medium">Unable to load statistics.</p>
      </Card>
    );
  }

  const topCourse = sortedCourses[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatSummaryCard icon={<Users className="h-4 w-4" />} label="Total Students" value={stats.totalStudents.toString()} />
        <StatSummaryCard icon={<GraduationCap className="h-4 w-4" />} label="Active Programs" value={stats.courses.length.toString()} />
        <StatSummaryCard icon={<BarChart3 className="h-4 w-4" />} label="Top Program" value={topCourse ? topCourse.name : 'N/A'} isLargeValue={false} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Distribution</CardTitle>
          <CardDescription>Student count by academic program.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="px-1">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Detailed Breakdown</h3>
        </div>
        
        <div className="grid gap-4">
          {sortedCourses.map((course) => {
            const percentage = stats.totalStudents > 0 ? (course.count / stats.totalStudents) * 100 : 0;
            return (
              <Card key={course.name}>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold">{course.name}</p>
                      <p className="text-sm text-muted-foreground">{course.count} students enrolled</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {course.yearLevels.map((item) => (
                      <div key={`${course.name}-${item.level}`} className="p-3 rounded-md bg-muted/30 border border-border/50 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{item.level}</p>
                        <p className="text-base font-bold">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatSummaryCard({ icon, label, value, isLargeValue = true }: { icon: React.ReactNode, label: string, value: string, isLargeValue?: boolean }) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-[10px] uppercase font-bold tracking-wider truncate">{label}</span>
          </div>
          <p className={cn(
              "font-bold truncate",
              isLargeValue ? "text-2xl sm:text-3xl tabular-nums" : "text-sm sm:text-base leading-tight"
          )} title={value}>{value}</p>
        </CardContent>
      </Card>
    );
}
