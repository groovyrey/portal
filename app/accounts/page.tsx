'use client';

import FinancialSummary from '@/components/dashboard/FinancialSummary';
import Link from 'next/link';
import { useStudentQuery } from '@/lib/hooks';
import { 
  CreditCard, 
  History, 
  FileText, 
  Calendar,
  RefreshCw,
  Loader2,
  TrendingDown,
  AlertCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { toast } from 'sonner';

export default function AccountsPage() {
  const { data: student, isLoading: loadingQuery, isFetching, refetch } = useStudentQuery();

  const handleManualRefresh = async () => {
    if (!student) return;
    const refreshToast = toast.loading('Synchronizing latest financial records...');
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      });
      const result = await res.json();
      
      if (result.success) {
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        await refetch();
        toast.success('Accounts ledger updated!', { id: refreshToast });
      } else {
        toast.error(result.error || 'Sync failed.', { id: refreshToast });
      }
    } catch {
      toast.error('Failed to sync records.', { id: refreshToast });
    }
  };

  if (loadingQuery && !student) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10 circular" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!student || !student.financials) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <LottieAnimation 
          animationPath="/animations/girl-relaxing-error.json"
          className="w-64 h-64 mb-4"
        />
        <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">No Financial Records</h2>
        <p className="text-muted-foreground mb-8 max-w-sm font-bold uppercase leading-relaxed text-[10px] tracking-widest">
          We couldn&apos;t find any financial data for your account. Please log in or refresh your data from the dashboard.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/" 
            className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-lg shadow-xl hover:opacity-90 transition-all text-xs uppercase tracking-widest active:opacity-70"
          >
            Return Home
          </Link>
          <button 
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="px-6 py-3 bg-card border border-border text-muted-foreground font-black rounded-lg hover:bg-accent transition-all text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Retry Sync'}
          </button>
        </div>
      </div>
    );
  }

  const { financials } = student;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-lg text-primary-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Account Ledger</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Official Student Records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isFetching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent text-muted-foreground rounded-full border border-border"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Refreshing</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleManualRefresh}
              disabled={isFetching}
              className={`p-2.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all shadow-sm ${isFetching ? 'cursor-not-allowed opacity-50' : ''}`}
              title="Manual Sync"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={item}>
            <FinancialSummary financials={financials} />
          </motion.div>

          {/* Due Accounts Table */}
          {financials.dueAccounts && financials.dueAccounts.length > 0 && (
            <motion.div variants={item} className="surface-neutral rounded-xl border border-border/50 overflow-hidden shadow-sm ring-1 ring-black/5">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Payment Schedule</h2>
                </div>
                {financials.dueToday && financials.dueToday !== '₱0.00' && (
                  <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20 uppercase tracking-widest">Payable Today</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Due Date</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Amount</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Paid</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {financials.dueAccounts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-muted-foreground font-mono">
                            {item.dueDate}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-black text-foreground uppercase tracking-tight">{item.description}</p>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-muted-foreground text-right tabular-nums">₱{item.amount.replace('₱', '')}</td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-500 text-right tabular-nums">₱{item.paid.replace('₱', '')}</td>
                        <td className="px-5 py-4 text-right">
                          <span className={`text-sm font-black tabular-nums ${item.due.replace('₱', '') !== '0.00' ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            ₱{item.due.replace('₱', '')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Payment History */}
          {financials.payments && financials.payments.length > 0 && (
            <motion.div variants={item} className="surface-neutral rounded-xl border border-border/50 overflow-hidden shadow-sm ring-1 ring-black/5">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                    <History className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Transaction History</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reference</th>
                      <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {financials.payments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-foreground">{item.date}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-[9px] font-black text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest">
                            {item.reference}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-base font-black text-foreground tabular-nums">₱{item.amount.replace('₱', '')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assessment Details */}
            {financials.assessment && financials.assessment.length > 0 && (
              <motion.div variants={item} className="surface-neutral rounded-xl border border-border/50 overflow-hidden shadow-sm h-full ring-1 ring-black/5">
                <div className="p-5 border-b border-border flex items-center gap-3 bg-muted/20">
                  <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Fee Breakdown</h2>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-border/50">
                      {financials.assessment.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-5 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-tight">{item.description}</td>
                          <td className="px-5 py-3.5 text-xs font-black text-foreground text-right tabular-nums">₱{item.amount.replace('₱', '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Installments */}
              {financials.installments && financials.installments.length > 0 && (
                <motion.div variants={item} className="surface-neutral rounded-xl border border-border/50 overflow-hidden shadow-sm ring-1 ring-black/5">
                  <div className="p-5 border-b border-border flex items-center gap-3 bg-muted/20">
                    <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-500">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Installments</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="px-5 py-2.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Period</th>
                          <th className="px-5 py-2.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {financials.installments.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{item.description}</p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.dueDate}</p>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {item.outstanding.replace('₱', '') === '0.00' ? (
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Paid</span>
                              ) : (
                                <span className="text-xs font-black text-red-500 tabular-nums">₱{item.outstanding.replace('₱', '')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Adjustments */}
              {financials.adjustments && financials.adjustments.length > 0 && (
                <motion.div variants={item} className="surface-neutral rounded-xl border border-border/50 overflow-hidden shadow-sm ring-1 ring-black/5">
                  <div className="p-5 border-b border-border flex items-center gap-3 bg-muted/20">
                    <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-500">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Adjustments</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-border/50">
                        {financials.adjustments.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{item.description}</p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.dueDate}</p>
                            </td>
                            <td className="px-5 py-3 text-xs font-black text-blue-500 text-right tabular-nums">₱{item.adjustment.replace('₱', '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
