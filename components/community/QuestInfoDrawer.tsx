'use client';

import React from 'react';
import { Trophy, Zap, Sparkles } from 'lucide-react';
import Drawer from '@/components/layout/Drawer';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface QuestInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStats: any;
  isStaff: boolean;
}

export default function QuestInfoDrawer({ isOpen, onClose, currentStats, isStaff }: QuestInfoDrawerProps) {
  const dailyExp = currentStats?.dailyExp || 0;
  const expProgress = Math.min(100, (dailyExp / 500) * 100);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Quest Center Guide"
      side="bottom"
    >
      <div className="space-y-6 pb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Daily EXP
            </h3>
            <span className="text-sm font-bold">{dailyExp} / 500</span>
          </div>
          <Progress value={expProgress} className="h-2" />
          <p className="text-xs text-muted-foreground leading-tight">
            Earn up to 500 EXP daily. Resets at midnight (PHT).
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Trophy size={16} className="text-orange-500" />
              Daily Streak
            </h3>
            <span className="text-xl font-bold text-orange-500">{currentStats?.streak || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">
            Keep completing quests to grow your streak!
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            About Quest Center
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            Quest Center is a gamified learning platform where LCCians can test their knowledge with AI-powered trivia across diverse topics.
          </p>
          <p className="text-xs text-muted-foreground italic">
            Note: Questions are adjusted based on your academic level.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rules</h3>
          <ul className="space-y-2">
            {[
              'One EXP-earning quest per category daily.',
              '10 questions per run.',
              'Difficulty scales with your level.',
              'Midnight reset (PHT).',
              ...(isStaff ? ['Staff: Test Mode enabled.'] : []),
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                <span className="text-xs text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div className="pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center">
            Master the Hub
          </p>
        </div>
      </div>
    </Drawer>
  );
}
