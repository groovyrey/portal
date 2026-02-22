'use client';

import { Student } from '@/types';
import { 
  Mail, 
  ShieldCheck,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalInfoProps {
  student: Student;
  isPublic?: boolean;
}

export default function PersonalInfo({ student, isPublic = false }: PersonalInfoProps) {
  const showPersonal = !isPublic || (student.settings?.isPublic ?? true);

  const details = [
    { label: 'Email', value: student.email, icon: Mail, visible: !isPublic },
  ];

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student Identity</h3>
          </div>
        </div>

        <div className="space-y-6">
          {details.filter(d => d.visible).map((detail, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="mt-1">
                <detail.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{detail.label}</p>
                <p className="text-sm font-medium text-slate-700 break-words">{detail.value || '?'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />
              <span className="text-xs font-mono font-bold tracking-tight">{student.id}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Student ID</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
