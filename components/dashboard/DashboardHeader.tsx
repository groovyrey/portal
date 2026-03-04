'use client';

import { Student } from '@/types';
import { LogOut, GraduationCap, Calendar, UserCheck, LayoutDashboard, Hash, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  student: Student;
}

export default function DashboardHeader({ student }: DashboardHeaderProps) {
    return (
      <div className="mb-8 space-y-6">
        {/* Large Scrolling Subject Titles Marquee - Top Decorative Header */}
        <div className="relative overflow-hidden pointer-events-none opacity-80 dark:opacity-90 py-2 -mx-4 sm:-mx-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] mb-0">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              duration: 120, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex whitespace-nowrap items-center w-fit"
          >
            {/* Double the content for seamless looping */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-20 pr-20">
                {student.schedule?.map((item, idx) => {
                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                  const fonts = [
                    'font-black tracking-tighter italic', 
                    'font-bold tracking-[0.3em]', 
                    'font-medium tracking-tight', 
                    'font-black tracking-widest uppercase',
                    'font-light tracking-[0.5em] uppercase'
                  ];
                  const styleIdx = idx % fonts.length;
                  const colorIdx = idx % colors.length;
                  const randomColor = colors[colorIdx];
                  const randomStyle = fonts[styleIdx];
                  return (
                    <span 
                      key={idx} 
                      className={`text-3xl sm:text-7xl uppercase ${randomStyle}`}
                      style={{ 
                        color: randomColor,
                        textShadow: `2px 2px 0px ${randomColor}44`
                      }}
                    >
                      {item.description}
                    </span>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Dashboard</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">System Online</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden group hover:border-muted-foreground transition-all duration-500"
        >
          {/* Decorative Background Elements */}
          <motion.div 
            animate={{ 
              y: [0, -25, 0],
              x: [0, 15, 0],
            }}
            whileHover={{ scale: 1.15 }}
            transition={{ 
              y: { 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut" 
              },
              x: { 
                duration: 12, 
                repeat: Infinity, 
                ease: "easeInOut" 
              },
              scale: { duration: 0.5 }
            }}
            className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32"
          ></motion.div>
          <motion.div 
            animate={{ 
              y: [0, 30, 0],
              x: [0, -20, 0],
            }}
            whileHover={{ scale: 1.1 }}
            transition={{ 
              y: { 
                duration: 15, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1 
              },
              x: { 
                duration: 13, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5 
              },
              scale: { duration: 0.5 }
            }}
            className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full -ml-24 -mb-24"
          ></motion.div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:scale-105">
                <span className="text-3xl font-black">
                  {(student.parsedName?.firstName?.[0] || student.name?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div className="text-center sm:text-left space-y-4">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">Active Session</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-none tracking-tight">
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
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 bg-accent text-muted-foreground rounded-lg border border-border shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
        <p className="text-xs font-bold text-foreground leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-accent/50 border border-border p-4 rounded-2xl flex-1 min-w-[120px] transition-all hover:bg-card hover:shadow-md hover:-translate-y-1 duration-300">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-card rounded-lg text-primary border border-border/50 shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-black text-foreground tracking-tight">{value}</span>
      </div>
    </div>
  );
}
