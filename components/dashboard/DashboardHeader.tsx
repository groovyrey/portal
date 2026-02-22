'use client';

import { Student } from '@/types';
import { LogOut, GraduationCap, Calendar, UserCheck, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
}

export default function DashboardHeader({ student }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Academic Management</p>
          </div>
        </div>
      </div>

      {/* Profile Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Enrollment</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {student.parsedName 
                ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                : (student.name || '?')}
            </h2>
            
            <div className="flex items-center gap-2 mt-2 text-slate-500">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">{student.course || '?'}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year Level</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{student.yearLevel || '?'}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{student.semester || '?'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
