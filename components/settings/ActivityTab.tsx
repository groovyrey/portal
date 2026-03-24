'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Loader2, 
  Lock, 
  Shield, 
  Info, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/activity');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch activity logs', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-none">Activity History</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1.5">Last 15 actions performed by you.</p>
          </div>
        </div>

        <div className="relative group min-w-[240px]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className={`h-4 w-4 transition-colors ${searchQuery ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <input
            type="text"
            placeholder="Filter logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-accent border border-border focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium transition-all outline-none text-foreground"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-muted-foreground hover:text-primary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card rounded-2xl border border-border">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-2xl border border-border border-dashed">
            <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Recent Activity</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-2xl border border-border border-dashed">
            <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matches for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/50 border-t border-border/50 mt-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log) => {
                const date = new Date(log.createdAt);
                const isToday = new Date().toDateString() === date.toDateString();
                
                let Icon = History;
                let iconBg = "bg-accent/50";
                let iconColor = "text-muted-foreground";

                const action = log.action.toLowerCase();
                if (action.includes('login')) { Icon = Lock; iconBg = "bg-blue-500/10"; iconColor = "text-blue-500"; }
                else if (action.includes('security') || action.includes('password')) { Icon = Shield; iconBg = "bg-amber-500/10"; iconColor = "text-amber-500"; }
                else if (action.includes('settings')) { Icon = Info; iconBg = "bg-purple-500/10"; iconColor = "text-purple-500"; }
                else if (action.includes('ai') || action.includes('assistant')) { Icon = Sparkles; iconBg = "bg-indigo-500/10"; iconColor = "text-indigo-500"; }
                else if (action.includes('community') || action.includes('post') || action.includes('comment')) { Icon = MessageSquare; iconBg = "bg-emerald-500/10"; iconColor = "text-emerald-500"; }
                else if (action.includes('system') || action.includes('diagnostic')) { Icon = ShieldCheck; iconBg = "bg-primary/10"; iconColor = "text-primary"; }

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={log.id} 
                    className="group flex gap-4 py-5 px-1 hover:bg-accent/20 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-white/10 shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <h4 className="text-sm font-bold text-foreground break-words uppercase tracking-tight">
                          {typeof log.details === 'object' && log.details.message ? log.details.message : log.action}
                        </h4>
                        <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/50'}`}>
                          {isToday ? 'Today' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {typeof log.details === 'object' 
                          ? (log.details.changes 
                              ? `Changed: ${log.details.changes}` 
                              : (log.details.post || log.details.comment || log.details.message || log.action))
                          : log.details}
                      </p>
                    </div>

                    {log.link && (
                      <div className="flex items-center pl-2">
                        <div className="p-2 rounded-xl bg-accent text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all shadow-sm">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
