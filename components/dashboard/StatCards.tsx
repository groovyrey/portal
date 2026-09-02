'use client';

import { Student } from '@/types';
import { BookOpen, Wallet, GraduationCap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CARD_THEMES, CardThemeKey } from '@/lib/card-themes';

export default function StatCards({ student }: { student: Student }) {
  const stats = [
    {
      label: 'Balance',
      value: student.financials?.balance || '₱0.00',
      icon: Wallet,
      href: '/accounts',
      theme: 'emerald' as CardThemeKey,
    },
    {
      label: 'Units',
      value: student.schedule?.reduce((acc, curr) => acc + (parseFloat(curr.units) || 0), 0) || 0,
      icon: BookOpen,
      href: '/',
      theme: 'sky' as CardThemeKey,
    },
    {
      label: 'Grade Reports',
      value: student.availableReports?.length || 0,
      icon: GraduationCap,
      href: '/grades',
      theme: 'violet' as CardThemeKey,
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {stats.map((stat, idx) => {
        const theme = CARD_THEMES[stat.theme];
        return (
          <Link key={idx} href={stat.href} className="group">
            <Card className={cn(
              "h-full border-border transition-all hover:shadow-md hover:border-primary/30",
              theme.bg
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", theme.tile)}>
                  <stat.icon className={cn("h-4 w-4", theme.icon)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tracking-tight tabular-nums">{stat.value}</div>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  Details
                  <ChevronRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
