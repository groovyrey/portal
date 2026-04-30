'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Loader2,
  Zap,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DailyQuestTab from '@/components/dashboard/DailyQuestTab';
import TestQuestTab from '@/components/dashboard/TestQuestTab';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
import QuestInfoDrawer from '@/components/community/QuestInfoDrawer';
import { useStudent } from '@/lib/hooks';

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
          if (Array.isArray(data)) {
            setData(data);
          } else {
            console.error("Leaderboard Error:", data.error || "Invalid response");
            setData([]);
          }
        }
      })
      .catch((e) => {
        console.error("Fetch Error:", e);
        if (mounted) setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Fetching Champions...</p>
      </div>
    );
  }

  if (data.length === 0) {
     return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase tracking-tight">Hall of Fame</h3>
            <div className="flex bg-muted p-1 rounded-lg gap-1">
              <button 
                onClick={() => setFilter('all-time')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'all-time' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                All-Time
              </button>
              <button 
                onClick={() => setFilter('weekly')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'weekly' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="surface-neutral p-12 rounded-lg border border-border/50 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold uppercase">No Legends Yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs font-medium uppercase">
              Be the first to complete a quest this week and claim your spot!
            </p>
          </div>
        </div>
     );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black uppercase tracking-tight">Hall of Fame</h3>
        <div className="flex bg-muted p-1 rounded-lg gap-1">
          <button 
            onClick={() => setFilter('all-time')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'all-time' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            All-Time
          </button>
          <button 
            onClick={() => setFilter('weekly')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'weekly' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
          <span>Rank & Student</span>
          <span>{filter === 'weekly' ? 'Weekly' : 'Total'} EXP</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {data.map((student, index) => {
            const isTop3 = index < 3;
            const rankColors = [
              'text-amber-500 border-amber-500/20 bg-amber-500/5', // 1st
              'text-slate-400 border-slate-400/20 bg-slate-400/5', // 2nd
              'text-orange-500 border-orange-500/20 bg-orange-500/5', // 3rd
            ];

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`
                  relative flex items-center justify-between p-3 rounded-lg border transition-all
                  ${isTop3 ? 'bg-card border-primary/20' : 'bg-muted/10 border-border/40'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-md font-black text-xs border
                    ${isTop3 ? rankColors[index] : 'bg-muted/50 text-muted-foreground/50 border-border/50'}
                  `}>
                    {index + 1}
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm leading-tight truncate max-w-[160px] sm:max-w-[240px]">
                      {student.name}
                    </h4>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                      {student.course || 'LCC Student'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <p className="font-black text-base text-foreground tabular-nums leading-none">{(student.exp || 0).toLocaleString()}</p>
                      <p className="text-[8px] font-black uppercase tracking-tight text-primary mt-1">Level {student.level || 1}</p>
                   </div>
                   <ChevronRight className="h-3 w-3 text-muted-foreground/20" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function QuestsPage() {
  const { student } = useStudent();
  const isStaff = student?.badges?.includes('staff');

  const TABS = useMemo(() => [
    { id: 'daily', name: 'Daily Quest', icon: Trophy, desc: 'Today\'s trivia challenge' },
    ...(isStaff ? [{ id: 'test', name: 'Test Mode', icon: Zap, desc: 'Sandbox for testing features' }] : []),
    { id: 'leaderboard', name: 'Leaderboard', icon: TrendingUp, desc: 'Top LCC Questers' },
  ] as const, [isStaff]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const fetchCurrentStats = useCallback(async () => {
    if (!student?.id) return;
    try {
      const res = await fetch(`/api/quests/stats?studentId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStats(data);
      }
    } catch {
      // console.error("Failed to fetch current stats");
    }
  }, [student?.id]);

  useEffect(() => {
    fetchCurrentStats();
  }, [fetchCurrentStats]);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams, TABS]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <TabbedPageLayout
        title="Quest Center"
        icon={Trophy}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
    >
      {activeTab === 'daily' && (
        <div className="surface-neutral p-6 sm:p-8 rounded-lg border border-border/50">
          <DailyQuestTab />
        </div>
      )}

      {activeTab === 'test' && (
        <div className="surface-neutral p-6 sm:p-8 rounded-lg border border-border/50">
          <TestQuestTab />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab />
      )}
    </TabbedPageLayout>
    </>
  );
}





