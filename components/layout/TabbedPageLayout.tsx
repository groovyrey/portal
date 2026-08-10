'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  name: string;
  icon: LucideIcon;
  desc?: string;
}

interface TabbedPageLayoutProps<T extends string> {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  tabs: readonly TabItem<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  sidebarFooter?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function TabbedPageLayout<T extends string>({
  title,
  icon: Icon,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  headerRight,
  children,
}: TabbedPageLayoutProps<T>) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-16 lg:pb-0">
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            </div>
            {headerRight}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
