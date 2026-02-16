'use client';

import { Student } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalInfoProps {
  student: Student;
}

export default function PersonalInfo({ student }: PersonalInfoProps) {
  const details = [
    { label: 'Gender', value: student.gender, icon: User },
    { label: 'Contact', value: student.contact, icon: Phone },
    { label: 'Email', value: student.email, icon: Mail },
    { label: 'Address', value: student.address, icon: MapPin },
  ];

  const initials = student.name
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
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Official Record</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="mt-1">
                <detail.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{detail.label}</p>
                <p className="text-sm font-medium text-slate-700">{detail.value || 'Not provided'}</p>
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
