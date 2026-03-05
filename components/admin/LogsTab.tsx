'use client';

import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  History, 
  Loader2, 
  User, 
  Clock, 
  Search, 
  Inbox, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AdminLog {
  id: string;
  timestamp: any;
  adminId: string;
  adminName: string;
  targetId: string;
  targetName?: string;
  action: string;
  details: string;
}

const formatTimestamp = (ts: any) => {
  if (!ts) return 'Unknown';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LogRow = memo(({ log }: { log: AdminLog }) => (
  <tr className="hover:bg-accent/50 transition-colors group">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5 shadow-sm">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.adminName}</span>
          <span className="font-mono text-[9px] font-bold text-muted-foreground bg-accent group-hover:bg-background px-1.5 py-0.5 rounded w-fit transition-colors">
            {log.adminId}
          </span>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
          <Zap className="h-3 w-3" />
          {log.action}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground leading-relaxed line-clamp-1 max-w-[300px]">
          {log.details}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex flex-col">
        <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.targetName || 'System'}</span>
        <span className="font-mono text-[9px] font-bold text-muted-foreground bg-accent group-hover:bg-background px-1.5 py-0.5 rounded w-fit transition-colors">
          {log.targetId}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 text-right whitespace-nowrap">
      <div className="flex items-center justify-end gap-2 text-muted-foreground">
        <Clock className="h-3.5 w-3.5 opacity-50" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">{formatTimestamp(log.timestamp)}</span>
      </div>
    </td>
  </tr>
));

LogRow.displayName = 'LogRow';

export default function LogsTab() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        } else {
          toast.error(data.error || 'Failed to fetch logs');
        }
      } catch (err) {
        toast.error('Network error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.adminName.toLowerCase().includes(term) ||
      log.adminId.toLowerCase().includes(term) ||
      log.targetId.toLowerCase().includes(term) ||
      (log.targetName && log.targetName.toLowerCase().includes(term)) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Search Header */}
        <div className="p-4 border-b border-border bg-accent/30 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter audit trail by admin, target, or action..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg shadow-sm">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Total Logs: {logs.length}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-4 bg-accent/20">Authorized Admin</th>
                <th className="px-6 py-4 bg-accent/20">Operational Action</th>
                <th className="px-6 py-4 bg-accent/20">Target Context</th>
                <th className="px-6 py-4 bg-accent/20 text-right">Sequence Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.tr 
                    key="loading"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accessing Logs...</span>
                    </td>
                  </motion.tr>
                ) : filteredLogs.length === 0 ? (
                  <motion.tr 
                    key="empty"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={4} className="px-6 py-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Inbox size={48} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Audit Records Found</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-border bg-accent/10 flex items-center justify-between">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Event Sequence {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110' 
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
