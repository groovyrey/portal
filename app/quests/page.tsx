'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Loader2,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DailyQuestTab from '@/components/dashboard/DailyQuestTab';
import TestQuestTab from '@/components/dashboard/TestQuestTab';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';
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
        if (mounted) setData(data);
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
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Hall of Fame</h3>
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              <button 
                onClick={() => setFilter('all-time')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all-time' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                All-Time
              </button>
              <button 
                onClick={() => setFilter('weekly')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'weekly' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="surface-neutral p-12 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
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
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Hall of Fame</h3>
        <div className="flex bg-muted p-1 rounded-xl gap-1">
          <button 
            onClick={() => setFilter('all-time')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all-time' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            All-Time
          </button>
          <button 
            onClick={() => setFilter('weekly')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'weekly' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
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
                  relative flex items-center justify-between p-3 rounded-xl border transition-all
                  ${isTop3 ? 'bg-card border-primary/20' : 'bg-muted/10 border-border/40'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-lg font-black text-xs border
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
                      <p className="font-black text-base text-foreground tabular-nums leading-none">{student.exp.toLocaleString()}</p>
                      <p className="text-[8px] font-black uppercase tracking-tighter text-primary mt-1">Level {student.level}</p>
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
    <TabbedPageLayout
      title="Quest Center"
      icon={Trophy}
      subtitle="Knowledge Challenge"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sidebarFooter={
        <div className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap size={12} className="fill-primary" />
                Daily EXP Cap
              </h3>
              <span className="text-[10px] font-black text-primary">{(currentStats?.dailyExp || 0)} / 500</span>
            </div>
            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((currentStats?.dailyExp || 0) / 500) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
              Earn up to 500 EXP daily across all quest categories.
            </p>
          </div>

          <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <Trophy size={12} className="fill-orange-500" />
                Daily Streak
              </h3>
              <span className="text-xl font-black italic text-orange-500">{currentStats?.streak || 0}</span>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
              Quested {currentStats?.streak || 0} days in a row! Keep it up!
            </p>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Sparkles size={12} />
              What is Quest Center?
            </h3>
            <p className="text-[11px] font-bold text-foreground leading-relaxed">
              Quest Center is a gamified learning platform where LCCians can test their knowledge with AI-generated trivia across diverse topics and their actual academic subjects.
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
              Note: Questions are AI-powered and dynamically adjusted based on your student level.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Quick Rules</h3>
            <ul className="space-y-2">
              {[
                'One EXP-earning quest per day.',
                '10 challenging questions per run.',
                'Level-based difficulty scaling.',
                ...(isStaff ? ['Test Mode: Sandbox for new features.'] : []),
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2 group px-1">
                  <div className="mt-1 h-1 w-1 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-3 w-3 text-primary" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Achievements</h3>
            </div>
            <p className="text-[9px] font-bold text-foreground leading-tight">
              Perfect runs earn the &ldquo;Quest Master&rdquo; badge. Reach Level 100 for the &ldquo;Centurion&rdquo; title!
            </p>
          </div>
        </div>
      }
    >
      {activeTab === 'daily' && (
        <div className="surface-neutral p-6 sm:p-8 rounded-2xl border border-border/50">
          <DailyQuestTab />
        </div>
      )}

      {activeTab === 'test' && (
        <div className="surface-neutral p-6 sm:p-8 rounded-2xl border border-border/50">
          <TestQuestTab />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab />
      )}
    </TabbedPageLayout>
  );
}





