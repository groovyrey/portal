'use client';

import { Student } from '../types';
import { LogOut, GraduationCap, Calendar, UserCheck, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
  onLogout: () => void;
}

export default function DashboardHeader({ student, onLogout }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Student Portal</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LCC Academic Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold rounded-xl text-xs transition-all duration-200 flex items-center gap-2 border border-slate-100 hover:border-red-100 shadow-sm active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Info Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200"
      >
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Enrollment</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight text-center md:text-left leading-tight">
              {student.name}
            </h2>
            
            <div className="flex items-center gap-2 mt-3 text-slate-400">
              <GraduationCap className="h-4 w-4" />
              <p className="font-bold text-sm tracking-wide">{student.course}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center md:justify-end">
            <div className="px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col items-center md:items-start min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-blue-400" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Year Level</span>
              </div>
              <span className="text-xs font-black text-white uppercase">{student.yearLevel}</span>
            </div>

            <div className="px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col items-center md:items-start min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-3 w-3 text-indigo-400" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
              </div>
              <span className="text-xs font-black text-white uppercase">{student.semester}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
