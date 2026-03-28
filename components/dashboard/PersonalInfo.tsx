'use client';

import { Student } from '@/types';
import { 
  Mail, 
  ShieldCheck,
  Hash,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  User,
  BookOpen,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtime } from '@/components/shared/RealtimeProvider';

import Image from 'next/image';

interface PersonalInfoProps {
  student: Student;
  isPublic?: boolean;
}

export default function PersonalInfo({ student, isPublic = false }: PersonalInfoProps) {
  const { onlineMembers } = useRealtime();
  const showAcademic = !isPublic || (student.settings?.showAcademicInfo ?? true);

  const memberStatus = onlineMembers.get(student.id);
  const isStudying = memberStatus?.isStudying;
  
  // Use DiceBear lorelei avatar based on student ID (clean and modern)
  const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${student.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffeb99`;

  const details = [
    { label: 'Full Name', value: student.name, icon: User, visible: true },
    { label: 'Degree / Course', value: student.course, icon: GraduationCap, visible: showAcademic },
    { label: 'Year & Semester', value: student.yearLevel && student.semester ? `${student.yearLevel} / ${student.semester}` : null, icon: Calendar, visible: showAcademic },
    { label: 'Email Address', value: student.email, icon: Mail, visible: !isPublic },
    { label: 'Mobile Number', value: student.mobile, icon: Phone, visible: !isPublic },
    { label: 'Address', value: student.address, icon: MapPin, visible: !isPublic },
  ].filter(d => d.visible && d.value);

  const initials = student.parsedName 
    ? (student.parsedName.firstName[0] + (student.parsedName.lastName[0] || '')).toUpperCase()
    : student.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative h-14 w-14 rounded-2xl bg-secondary/50 overflow-hidden border border-primary/20 shadow-sm flex items-center justify-center">
            <Image 
              src={avatarUrl} 
              alt={`${student.name}'s avatar`}
              width={56}
              height={56}
              className="object-cover"
              unoptimized
            />
            {isStudying && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center"
              >
                <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-black text-foreground uppercase tracking-tight truncate">Academic Profile</h3>
              <AnimatePresence>
                {isStudying && (
                  <motion.span 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-[8px] font-black text-primary uppercase tracking-widest animate-pulse border border-primary/20"
                  >
                    Studying
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{student.course}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-4 group">
              <div className="mt-0.5 p-2 rounded-lg bg-accent text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all border border-border">
                <detail.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">{detail.label}</p>
                <p className="text-sm font-bold text-foreground break-words leading-tight">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center border border-border shadow-sm">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[8px] font-black text-blue-500/70 dark:text-blue-400/80 uppercase tracking-[0.2em] leading-none mb-1">Student Identifier</p>
                <p className="text-sm font-mono font-bold text-foreground leading-none">{student.id}</p>
              </div>
            </div>
            {student.settings?.isPublic && (
              <div className="p-1.5 bg-emerald-500/10 rounded-lg" title="Profile is public">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
