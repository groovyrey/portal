'use client';

import React from 'react';
import { Trophy, Zap, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Drawer from '@/components/layout/Drawer';

interface QuestInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStats: any;
  isStaff: boolean;
}

export default function QuestInfoDrawer({ isOpen, onClose, currentStats, isStaff }: QuestInfoDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Quest Center Guide"
      side="bottom"
    >
      <div className="space-y-6 pb-8">
        <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Zap size={14} className="fill-primary" />
              Daily EXP Cap
            </h3>
            <span className="text-xs font-black text-primary">{(currentStats?.dailyExp || 0)} / 500</span>
          </div>
          <div className="h-2.5 w-full bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((currentStats?.dailyExp || 0) / 500) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
            Earn up to 500 EXP daily across all quest categories. This resets every day at midnight (PHT).
          </p>
        </div>

        <div className="bg-orange-500/5 p-5 rounded-xl border border-orange-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
              <Trophy size={14} className="fill-orange-500" />
              Daily Streak
            </h3>
            <span className="text-2xl font-black italic text-orange-500">{currentStats?.streak || 0}</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
            You've completed quests for {currentStats?.streak || 0} consecutive days! Don't break the chain.
          </p>
        </div>

        <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Sparkles size={14} />
            What is Quest Center?
          </h3>
          <p className="text-sm font-bold text-foreground leading-relaxed">
            Quest Center is a gamified learning platform where LCCians can test their knowledge with AI-powered trivia across diverse topics and their actual academic subjects.
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
            Note: Questions are dynamically adjusted based on your student level and academic progress.
          </p>
        </div>

        <div className="space-y-4 px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Rules</h3>
          <ul className="space-y-3">
            {[
              'One EXP-earning quest per category daily.',
              '10 challenging questions per run.',
              'Difficulty scales with your level.',
              'Midnight reset (PHT) for all categories.',
              ...(isStaff ? ['Test Mode: Sandbox for new features.'] : []),
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Achievements</h3>
          </div>
          <p className="text-[11px] font-bold text-foreground leading-tight">
            Perfect runs (10/10) earn the &ldquo;Quest Master&rdquo; badge. Reach Level 100 to claim the &ldquo;Centurion&rdquo; title!
          </p>
        </div>
      </div>
    </Drawer>
  );
}
