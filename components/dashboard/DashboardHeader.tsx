'use client';

import { Student } from '@/types';
import { Calendar, LayoutDashboard, Hash, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
}

export default function DashboardHeader({ student }: DashboardHeaderProps) {
    return (
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">System Online</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500"
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform duration-500 group-hover:scale-105">
                <span className="text-2xl font-bold">
                  {(student.parsedName?.firstName?.[0] || student.name?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div className="text-center sm:text-left space-y-3">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/10">Active Session</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
                    {student.parsedName
                      ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                      : (student.name || '?')}
                  </h2>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <InfoItem 
                    label="Student ID" 
                    value={student.id} 
                    icon={<Hash className="h-3 w-3" />} 
                  />
                  <InfoItem 
                    label="Degree Program" 
                    value={student.course || '?'} 
                    icon={<BookOpen className="h-3 w-3" />} 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start lg:justify-end gap-3 pt-6 lg:pt-0 border-t lg:border-t-0 border-border/50">
              <StatItem 
                label="Year Level" 
                value={student.yearLevel || '?'} 
                icon={<Calendar className="h-4 w-4" />} 
              />
              <StatItem 
                label="Semester" 
                value={student.semester || '?'} 
                icon={<LayoutDashboard className="h-4 w-4" />} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 bg-muted text-muted-foreground rounded-lg border border-border/50">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-sm font-medium text-foreground leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-muted/30 border border-border/50 p-4 rounded-xl flex-1 min-w-[120px] transition-all hover:bg-card hover:shadow-sm duration-300">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-card rounded-lg text-primary/80 border border-border/50">
          {icon}
        </div>
        <span className="text-sm font-bold text-foreground tracking-tight">{value}</span>
      </div>
    </div>
  );
}
