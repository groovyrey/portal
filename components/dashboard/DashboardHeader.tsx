'use client';

import { Student } from '@/types';
import { LogOut, GraduationCap, Calendar, UserCheck, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
}

export default function DashboardHeader({ student }: DashboardHeaderProps) {
    return (
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Official Student Console</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm group hover:border-muted-foreground transition-all duration-300"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <span className="text-xl font-bold">
                  {(student.parsedName?.firstName?.[0] || student.name?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  {student.parsedName
                    ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                    : (student.name || '?')}
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-accent text-muted-foreground rounded-md text-[10px] font-bold">
                    <UserCheck className="h-3 w-3" />
                    {student.id}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-accent text-muted-foreground rounded-md text-[10px] font-bold">
                    <GraduationCap className="h-3 w-3" />
                    {student.course || '?'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
              <div className="bg-accent border border-border p-3 rounded-xl flex-1 sm:min-w-[100px]">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Year</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">{student.yearLevel || '?'}</span>
                </div>
              </div>
              <div className="bg-accent border border-border p-3 rounded-xl flex-1 sm:min-w-[100px]">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Sem</p>
                <div className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">{student.semester || '?'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
}

