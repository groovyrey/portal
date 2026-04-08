'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  name: string;
  icon: LucideIcon;
  desc?: string;
}

interface TabbedPageLayoutProps {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  tabs: readonly TabItem[];
  activeTab: string;
  onTabChange: (id: any) => void;
  sidebarFooter?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function TabbedPageLayout({
  title,
  icon: Icon,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  sidebarFooter,
  headerRight,
  children
}: TabbedPageLayoutProps) {
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground pb-16 lg:pb-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight uppercase">{title}</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{subtitle || 'LCCian Hub'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <tab.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-primary-foreground' : 'text-primary'}`} />
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">{tab.name}</p>
                  {tab.desc && (
                    <p className={`text-[9px] mt-1 ${activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{tab.desc}</p>
                  )}
                </div>
              </button>
            ))}
          </nav>

          {sidebarFooter && (
            <div className="p-3 border-t border-border bg-muted/5">
              {sidebarFooter}
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-background sticky top-16 z-30">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm uppercase">{title}</span>
            </div>
            {headerRight}
          </header>

          <div className="lg:hidden flex items-center gap-1 bg-card p-2 border-b border-border overflow-x-auto no-scrollbar sticky top-32 z-20 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  {currentTab.name}
                </h1>
                {currentTab.desc && (
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-1">
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
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
