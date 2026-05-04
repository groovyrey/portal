'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Loader2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DailyQuestTab from '@/components/dashboard/DailyQuestTab';
import TestQuestTab from '@/components/dashboard/TestQuestTab';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import { useStudent } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type TabType = 'daily' | 'test' | 'leaderboard';

function LeaderboardTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'weekly' | 'all-time'>('all-time');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/quests/leaderboard?type=${filter}`)
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          if (Array.isArray(data)) setData(data);
          else setData([]);
        }
      })
      .catch(() => {
        if (mounted) setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  if (data.length === 0) {
     return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">Hall of Fame</h3>
              <p className="text-sm text-muted-foreground">Top achievers this week.</p>
            </div>
            <div className="flex bg-muted rounded-md p-1 self-start sm:self-auto">
              <Button 
                variant={filter === 'all-time' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('all-time')}
                className="h-8 text-xs"
              >
                All-Time
              </Button>
              <Button 
                variant={filter === 'weekly' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('weekly')}
                className="h-8 text-xs"
              >
                Weekly
              </Button>
            </div>
          </div>
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No entries yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Complete a quest to claim your spot!</p>
          </Card>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Hall of Fame</h3>
          <p className="text-sm text-muted-foreground">Top players by experience points.</p>
        </div>
        <div className="flex bg-muted rounded-md p-1 self-start sm:self-auto">
          <Button 
            variant={filter === 'all-time' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all-time')}
            className="h-8 text-xs"
          >
            All-Time
          </Button>
          <Button 
            variant={filter === 'weekly' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('weekly')}
            className="h-8 text-xs"
          >
            Weekly
          </Button>
        </div>
      </div>

      <div className="border rounded-md divide-y overflow-hidden">
        {data.map((student, index) => {
          const isTop3 = index < 3;
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex items-center gap-3 p-4 transition-colors",
                isTop3 ? "bg-accent/30" : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-xs border",
                index === 0 && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                index === 1 && "bg-slate-400/10 text-slate-600 border-slate-400/20",
                index === 2 && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                !isTop3 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{student.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{student.course || 'Student'}</p>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                 <div>
                    <p className="font-bold tabular-nums text-sm sm:text-base">{(student.exp || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-primary font-medium">Level {student.level || 1}</p>
                 </div>
                 <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuestsPage() {
  const { student } = useStudent();
  const isStaff = student?.badges?.includes('staff');

  const TABS = useMemo(() => [
    { id: 'daily' as const, name: 'Daily', icon: Trophy, desc: 'Challenge of the day' },
    ...(isStaff ? [{ id: 'test' as const, name: 'Sandbox', icon: Zap, desc: 'Practice and testing' }] : []),
    { id: 'leaderboard' as const, name: 'Board', icon: TrendingUp, desc: 'Top students' },
  ], [isStaff]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, TABS]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <TabbedPageLayout
      title="Quests"
      icon={Trophy}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div className="space-y-6">
        {(activeTab === 'daily' || activeTab === 'test') && (
          <Card>
            <CardContent className="p-6 md:p-8">
              {activeTab === 'daily' && <DailyQuestTab />}
              {activeTab === 'test' && <TestQuestTab />}
            </CardContent>
          </Card>
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab />
        )}
      </div>
    </TabbedPageLayout>
  );
}





