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
  ChevronRight,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    (typeof log.details === 'string' && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Activity</h4>
          <p className="text-sm text-muted-foreground">
            Recent actions performed on your account.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-8 hover:bg-transparent"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-md bg-muted/20">
            <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No activities found</p>
          </div>
        ) : (
          <div className="border rounded-md divide-y overflow-hidden">
            {filteredLogs.map((log) => {
              const date = new Date(log.createdAt);
              const isToday = new Date().toDateString() === date.toDateString();
              
              let Icon = History;
              const action = log.action.toLowerCase();
              if (action.includes('login')) Icon = Lock;
              else if (action.includes('security') || action.includes('password')) Icon = Shield;
              else if (action.includes('settings')) Icon = Info;
              else if (action.includes('ai') || action.includes('assistant')) Icon = Sparkles;
              else if (action.includes('community')) Icon = MessageSquare;
              else if (action.includes('system')) Icon = ShieldCheck;

              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors group">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">
                        {log.action}
                      </p>
                      <span className={cn(
                        "text-[10px] font-medium whitespace-nowrap",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {isToday ? 'Today' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {typeof log.details === 'object' 
                        ? (log.details.message || log.details.changes || log.action)
                        : log.details}
                    </p>
                  </div>

                  {log.link && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors self-center" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
