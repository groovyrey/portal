'use client';

import { Student } from '@/types';
import { 
  BookOpen, 
  Wallet, 
  GraduationCap, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function StatCards({ student }: { student: Student }) {
  const stats = [
    {
      label: 'Financial Balance',
      value: student.financials?.balance || '₱0.00',
      icon: Wallet,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      href: '/accounts'
    },
    {
      label: 'Total Units',
      value: student.schedule?.reduce((acc, curr) => acc + (parseFloat(curr.units) || 0), 0) || 0,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/'
    },
    {
      label: 'Subjects',
      value: student.schedule?.length || 0,
      icon: Layers,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      href: '/'
    },
    {
      label: 'Available Reports',
      value: student.availableReports?.length || 0,
      icon: GraduationCap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/grades'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Link key={idx} href={stat.href} className="group">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card border border-border p-5 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all active:scale-95 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className={`h-8 w-8 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color} border border-current/10`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                {stat.label}
              </p>
              <p className="text-lg font-black text-foreground tabular-nums tracking-tight">
                {stat.value}
              </p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
