'use client';

import { Student } from '@/types';
import { BookOpen, Wallet, GraduationCap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StatCards({ student }: { student: Student }) {
  const stats = [
    {
      label: 'Balance',
      value: student.financials?.balance || '₱0.00',
      icon: Wallet,
      href: '/accounts',
    },
    {
      label: 'Units',
      value: student.schedule?.reduce((acc, curr) => acc + (parseFloat(curr.units) || 0), 0) || 0,
      icon: BookOpen,
      href: '/',
    },
    {
      label: 'Grade Reports',
      value: student.availableReports?.length || 0,
      icon: GraduationCap,
      href: '/grades',
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {stats.map((stat, idx) => (
        <Link key={idx} href={stat.href} className="group">
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight tabular-nums">{stat.value}</div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                Details
                <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
