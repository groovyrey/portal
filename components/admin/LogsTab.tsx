'use client';

import React, { useEffect, useState } from 'react';
import { History, Loader2, User, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function LogsTab() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

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
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving Audit Trail...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] bg-card rounded-2xl border border-border p-12 text-center"
      >
        <div className="bg-accent p-4 rounded-full text-muted-foreground mb-6">
          <History className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">No logs found</h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest max-w-xs mx-auto">
          Audit logs will appear here as staff make changes to student records.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-accent/30">
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{log.adminName}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{log.adminId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tight">{log.action}</span>
                      <span className="text-[10px] font-medium text-muted-foreground line-clamp-1">{log.details}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{log.targetName}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{log.targetId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
