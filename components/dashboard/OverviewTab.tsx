'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/types';
import DailyGreeting from './DailyGreeting';
import StatCards from './StatCards';
import DashboardInsights from './DashboardInsights';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OverviewTabProps {
  student: Student;
}

const SYNC_NOTICE_KEY = 'hide_sync_speed_notice_v2';

export default function OverviewTab({ student }: OverviewTabProps) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(SYNC_NOTICE_KEY);
    if (!dismissed) {
      setShowNotice(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(SYNC_NOTICE_KEY, 'true');
    setShowNotice(false);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white dark:bg-blue-500/20 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest">Performance Notice</h4>
                      <p className="text-sm text-blue-900 leading-relaxed font-medium dark:text-blue-200/90">
                        Information sync may be slower than the official portal. Since LCC Hub retrieves data via automated scraping rather than having direct access to the school&apos;s internal database, processing your records takes a bit more time.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDismiss}
                        className="h-8 border-blue-300 hover:bg-blue-100 text-blue-800 dark:border-blue-500/30 dark:hover:bg-blue-500/10 dark:text-blue-300 font-semibold text-[10px] uppercase tracking-widest bg-transparent"
                      >
                        Okay
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <DailyGreeting student={student} />
      
      <StatCards student={student} />
      
      <DashboardInsights student={student} />
    </div>
  );
}
