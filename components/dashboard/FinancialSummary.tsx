import { Financials } from '@/types';
import { Wallet, Clock, AlertCircle, CreditCard, ArrowUpRight, TrendingDown } from 'lucide-react';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Wallet className="h-32 w-32 text-blue-600 rotate-12" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 border border-blue-100 shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] leading-none">Total Assessment</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Current Cycle</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              {financials.total || '₱0.00'}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50 w-fit px-3 py-1 rounded-lg border border-blue-100">
            <div className="h-1 w-1 rounded-full bg-blue-600" />
            Verified Record
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Clock className="h-32 w-32 text-orange-600 -rotate-12" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-50 p-2.5 rounded-2xl text-orange-600 border border-orange-100 shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] leading-none">Due Today</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Immediate Due</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black tracking-tighter leading-none ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'text-orange-600' : 'text-slate-900'}`}>
              {financials.dueToday || '₱0.00'}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Payable</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-500 sm:col-span-2 lg:col-span-1">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <AlertCircle className="h-32 w-32 text-red-600" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 border border-red-100 shadow-sm">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] leading-none">Remaining Balance</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Term Total</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black tracking-tighter leading-none ${financials.balance && financials.balance !== '₱0.00' ? 'text-red-600' : 'text-emerald-600'}`}>
              {financials.balance || '₱0.00'}
            </span>
          </div>
          <div className="mt-6">
            <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest w-fit ${
              financials.balance && financials.balance !== '₱0.00' 
                ? 'bg-red-50 text-red-600 border-red-100' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {financials.balance && financials.balance !== '₱0.00' ? 'Action Required' : 'Account Settled'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
