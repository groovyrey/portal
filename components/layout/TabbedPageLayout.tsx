'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  sidebarFooter,
  headerRight,
  children
}: TabbedPageLayoutProps<T>) {
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 lg:pb-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold tracking-tight truncate">{title}</h1>
                <p className="text-[11px] text-muted-foreground truncate">{subtitle || 'LCC Hub'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                  activeTab === tab.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                <tab.icon className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-105",
                  activeTab === tab.id ? 'text-accent-foreground' : 'text-muted-foreground'
                )} />
                <div className="text-left">
                  <p className="text-sm font-medium leading-none">{tab.name}</p>
                  {tab.desc && (
                    <p className={cn(
                      "text-[10px] mt-1 leading-tight",
                      activeTab === tab.id ? 'text-accent-foreground/80' : 'text-muted-foreground'
                    )}>{tab.desc}</p>
                  )}
                </div>
              </button>
            ))}
          </nav>

          {sidebarFooter && (
            <div className="p-4 border-t border-border bg-muted/30">
              {sidebarFooter}
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-background sticky top-16 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">{title}</span>
            </div>
            {headerRight}
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-muted/30 p-2 border-b border-border overflow-x-auto no-scrollbar sticky top-[7.5rem] z-20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          <main className="flex-1 p-4 lg:p-10">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 hidden lg:block">
                <h2 className="text-3xl font-bold tracking-tight">
                  {currentTab.name}
                </h2>
                {currentTab.desc && (
                  <p className="text-muted-foreground mt-2">
                    {currentTab.desc}
                  </p>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
