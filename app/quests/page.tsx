'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  LayoutGrid, 
  TrendingUp, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  School,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DailyQuestTab from '@/components/dashboard/DailyQuestTab';
import TabbedPageLayout from '@/components/layout/TabbedPageLayout';

type TabType = 'daily' | 'leaderboard' | 'knowledge';

const TABS = [
  { id: 'daily', name: 'Daily Quest', icon: Trophy, desc: 'Today\'s trivia challenge' },
  { id: 'leaderboard', name: 'Leaderboard', icon: TrendingUp, desc: 'Top LCC Questers' },
  { id: 'knowledge', name: 'Knowledge', icon: BookOpen, desc: 'Review past questions' },
] as const;

function LeaderboardTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quests/leaderboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

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
        <div className="surface-neutral p-12 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold uppercase">No Legends Yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs font-medium">
            Be the first to complete a quest and claim your spot on the leaderboard!
          </p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {data.map((student, index) => {
          const isTop3 = index < 3;
          const rankColors = [
            'bg-amber-400 text-amber-950 border-amber-500/50', // 1st
            'bg-slate-300 text-slate-900 border-slate-400/50', // 2nd
            'bg-orange-400 text-orange-950 border-orange-500/50', // 3rd
          ];

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all
                ${isTop3 ? 'bg-card border-primary/20 shadow-sm' : 'bg-muted/30 border-border/50'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm border
                  ${isTop3 ? rankColors[index] : 'bg-muted text-muted-foreground border-border'}
                `}>
                  {index + 1}
                </div>
                
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm sm:text-base leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                    {student.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">LVL {student.level}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{student.course || 'LCC Student'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                 <div className="hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quests</p>
                    <p className="font-bold text-sm">{student.total_quests}</p>
                 </div>
                 <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none mb-1">Total EXP</p>
                    <p className="font-black text-lg text-foreground leading-none">{student.exp.toLocaleString()}</p>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuestsPage() {
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
  }, [searchParams]);

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
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sidebarFooter={
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Quick Rules</h3>
            <ul className="space-y-2">
              {[
                'One quest attempt per day.',
                '5 questions per quest.',
                'Difficulty affects rank.',
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
              <Sparkles className="h-3 w-3 text-primary" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Challenge</h3>
            </div>
            <p className="text-[9px] font-bold text-foreground leading-tight">
              Complete 5 quests in a week for the **"Scholar's Streak"** badge!
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

      {activeTab === 'leaderboard' && (
        <LeaderboardTab />
      )}

      {activeTab === 'knowledge' && (
        <div className="surface-neutral p-12 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold uppercase">Knowledge Bank</h3>
          <p className="text-sm text-muted-foreground max-w-xs font-medium">
            Soon you'll be able to review all your past trivia questions and their explanations here.
          </p>
        </div>
      )}
    </TabbedPageLayout>
  );
}


