'use client';

import React, { useState } from 'react';
import { Student } from '@/types';
import { 
  User,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtime } from '@/components/shared/RealtimeProvider';
import StudentAvatar from '@/components/shared/StudentAvatar';

interface PersonalInfoProps {
  student: Student;
  isPublic?: boolean;
}

export default function PersonalInfo({ student, isPublic = false }: PersonalInfoProps) {
  const { onlineMembers } = useRealtime();
  const showAcademic = !isPublic || (student.settings?.showAcademicInfo ?? true);

  const memberStatus = onlineMembers.get(student.id);

  const details = [
    { label: 'Full Name', value: student.name, icon: User, visible: true },
    { label: 'Degree / Course', value: student.course, icon: GraduationCap, visible: showAcademic },
    { label: 'School Year', value: student.schoolYear, icon: Calendar, visible: showAcademic },
    { label: 'Year & Semester', value: student.yearLevel && student.semester ? `${student.yearLevel} / ${student.semester}` : null, icon: Calendar, visible: showAcademic },
    { label: 'Email Address', value: student.email, icon: Mail, visible: !isPublic },
    { label: 'Mobile Number', value: student.mobile, icon: Phone, visible: !isPublic },
    { label: 'Address', value: student.address, icon: MapPin, visible: !isPublic },
  ].filter(d => d.visible && d.value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-lg border border-border overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative h-14 w-14 rounded-md bg-secondary/50 overflow-hidden border border-primary/20 flex items-center justify-center">
            <StudentAvatar
              name={student.name}
              photoUrl={student.profilePhotoUrl}
              className="h-full w-full rounded-md"
              fallbackClassName="bg-transparent text-primary font-black text-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-black text-foreground uppercase tracking-tight truncate">Academic Profile</h3>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{student.course}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground shrink-0 border border-border/50">
                <detail.icon className="h-4 w-4" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{detail.label}</p>
                <p className="text-sm font-semibold text-foreground truncate break-words">
                  {detail.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {student.badges && student.badges.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4 px-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Digital Credentials</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {student.badges.map((badgeId) => (
                <div 
                  key={badgeId}
                  className="px-2.5 py-1 rounded-lg bg-muted border border-border text-[10px] font-bold text-foreground"
                >
                  {badgeId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
