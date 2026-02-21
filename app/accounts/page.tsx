'use client';

import { useState, useEffect } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleManualRefresh = async () => {
    if (!student) return;
    const refreshToast = toast.loading('Synchronizing latest financial records...');
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // This triggers auto-sync using session cookies
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
    } catch (err) {
      toast.error('Failed to sync records.', { id: refreshToast });
    }
  };

  if (!isInitialized || (loadingQuery && !student)) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-10 circular" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!student || !student.financials) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <LottieAnimation 
          animationPath="/animations/girl-relaxing-error.json"
          className="w-64 h-64 mb-4"
        />
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No Financial Records</h2>
        <p className="text-slate-500 mb-8 max-w-sm font-medium leading-relaxed text-sm">
          We couldn't find any financial data for your account. Please log in or refresh your data from the dashboard.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/" 
            className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-xs uppercase tracking-widest active:opacity-70"
          >
            Return Home
          </Link>
          <button 
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Account Ledger</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Student Records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {isFetching && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Refreshing...</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleManualRefresh}
              disabled={isFetching}
              className={`p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all shadow-sm active:opacity-70 ${isFetching ? 'cursor-not-allowed opacity-50' : ''}`}
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
          className="space-y-8"
        >
          <motion.div variants={item}>
            <FinancialSummary financials={financials} />
          </motion.div>

          {/* Due Accounts Table */}
          {financials.dueAccounts && financials.dueAccounts.length > 0 && (
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Payment Schedule</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Obligations</p>
                  </div>
                </div>
                {financials.dueToday && financials.dueToday !== '₱0.00' && (
                  <div className="px-3 py-1 bg-orange-100 rounded-lg border border-orange-200">
                    <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Payable Today</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Due Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Description</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Paid</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financials.dueAccounts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-xs font-black text-slate-500 font-mono bg-slate-100/80 px-2 py-1 rounded">
                            {item.dueDate}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{item.description}</p>
                        </td>
                        <td className="px-6 py-5 text-xs font-black text-slate-600 text-right uppercase">₱{item.amount.replace('₱', '')}</td>
                        <td className="px-6 py-5 text-xs font-black text-emerald-600 text-right uppercase">₱{item.paid.replace('₱', '')}</td>
                        <td className="px-6 py-5 text-right uppercase">
                          <span className={`text-xs font-black ${item.due.replace('₱', '') !== '0.00' ? 'text-orange-600' : 'text-slate-400'}`}>
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
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Transaction History</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Payments</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Payment Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Reference No.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financials.payments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-black text-slate-700">{item.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-[10px] font-black font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {item.reference}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right uppercase">
                          <span className="text-sm font-black text-slate-900">₱{item.amount.replace('₱', '')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assessment Details */}
            {financials.assessment && financials.assessment.length > 0 && (
              <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Fee Breakdown</h2>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-slate-100">
                      {financials.assessment.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-tight leading-tight">{item.description}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 text-right tabular-nums">₱{item.amount.replace('₱', '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            <div className="space-y-8">
              {/* Installments */}
              {financials.installments && financials.installments.length > 0 && (
                <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Installment Plan</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-50">
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Assessed</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {financials.installments.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-[10px] font-black text-slate-800 uppercase">{item.description}</p>
                              <p className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{item.dueDate}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-600 text-right tabular-nums">₱{item.assessed.replace('₱', '')}</td>
                            <td className="px-6 py-4 text-right tabular-nums">
                              {item.outstanding.replace('₱', '') === '0.00' ? (
                                <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                                  <span className="text-[10px] font-black uppercase tracking-widest">Paid</span>
                                  <div className="bg-emerald-100 p-0.5 rounded-full">
                                    <Check className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-red-600">₱{item.outstanding.replace('₱', '')}</span>
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
                <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                    <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Adjustments</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-50">
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                          <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Credit/Debit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {financials.adjustments.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-[10px] font-black text-slate-800 uppercase">{item.description}</p>
                              <p className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{item.dueDate}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-blue-600 text-right tabular-nums">₱{item.adjustment.replace('₱', '')}</td>
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
