'use client';

import { Student } from '@/types';
import { BookOpen, Wallet, GraduationCap, Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StatCards({ student }: { student: Student }) {
  const stats = [
    {
      label: 'Financial Balance',
      value: student.financials?.balance || '₱0.00',
      icon: Wallet,
      href: '/accounts'
    },
    {
      label: 'Total Units',
      value: student.schedule?.reduce((acc, curr) => acc + (parseFloat(curr.units) || 0), 0) || 0,
      icon: BookOpen,
      href: '/'
    },
    {
      label: 'Subjects',
      value: student.schedule?.length || 0,
      icon: Layers,
      href: '/'
    },
    {
      label: 'Available Reports',
      value: student.availableReports?.length || 0,
      icon: GraduationCap,
      href: '/grades'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, idx) => (
        <Link key={idx} href={stat.href} className="group">
          <article className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
