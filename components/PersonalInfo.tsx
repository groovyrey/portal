'use client';

import { Student } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalInfoProps {
  student: Student;
}

export default function PersonalInfo({ student }: PersonalInfoProps) {
  const details = [
    { label: 'Gender', value: student.gender, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Contact', value: student.contact, icon: Phone, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Email', value: student.email, icon: Mail, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Address', value: student.address, icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  // Get initials for avatar
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Decorative Header with Avatar */}
      <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute -bottom-10 left-6">
          <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg">
            <div className="h-full w-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl font-black text-slate-700">
              {initials}
            </div>
          </div>
        </div>
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="pt-12 pb-6 px-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Student Identity</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">LCC Official Record</p>
          </div>
          <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </div>
        </div>

        <div className="space-y-5">
          {details.map((detail, idx) => (
            <motion.div 
              key={idx} 
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 group"
            >
              <div className={`h-10 w-10 rounded-xl ${detail.bg} flex items-center justify-center transition-colors`}>
                <detail.icon className={`h-5 w-5 ${detail.color}`} />
              </div>
              <div className="flex-1 border-b border-slate-50 pb-2 group-last:border-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{detail.label}</p>
                <p className="text-sm font-bold text-slate-700 line-clamp-1">{detail.value || 'Not provided'}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Barcode-like student ID section */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Pass ID</span>
            <div className="flex gap-0.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`h-3 w-[2px] bg-slate-200 ${i % 3 === 0 ? 'h-5' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Hash className="h-3 w-3" />
            <span className="text-xs font-mono font-bold tracking-widest">{student.id}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
