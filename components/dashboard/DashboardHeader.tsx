'use client';

import { Student } from '@/types';
import { LogOut, GraduationCap, Calendar, UserCheck, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
}

export default function DashboardHeader({ student }: DashboardHeaderProps) {
    return (
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Dashboard
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Official Student Console</p>
          </div>
        </div>
  
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[2rem] p-8 relative overflow-hidden group hover:border-blue-200 transition-all duration-500 shadow-sm"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <GraduationCap size={160} />
          </div>
  
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                  <span className="text-2xl font-black">
                    {(student.parsedName?.firstName?.[0] || student.name?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enrolled & Active</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {student.parsedName
                      ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                      : (student.name || '?')}
                  </h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-wider">
                      <UserCheck className="h-3 w-3" />
                      {student.id}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100 text-[10px] font-black uppercase tracking-wider leading-none">
                      <GraduationCap className="h-3 w-3" />
                      {student.course || '?'}
                    </div>
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 lg:self-end">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex-1 sm:min-w-[120px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Year</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-sm font-black text-slate-700">{student.yearLevel || '?'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex-1 sm:min-w-[120px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Semester</p>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-sm font-black text-slate-700">{student.semester || '?'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
