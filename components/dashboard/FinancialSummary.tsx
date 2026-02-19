import { Financials } from '@/types';
import { Wallet, Clock, AlertCircle, CreditCard, ArrowUpRight, TrendingDown } from 'lucide-react';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet className="h-20 w-20 text-blue-600 rotate-12" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Assessment</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {financials.total || '₱0.00'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            Billed for current semester
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="h-20 w-20 text-orange-600 -rotate-12" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Due Today</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'text-orange-600' : 'text-slate-900'}`}>
              {financials.dueToday || '₱0.00'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className={`h-1 w-1 rounded-full ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
            Outstanding payable
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <AlertCircle className="h-20 w-20 text-red-600" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-50 p-2 rounded-xl text-red-600">
              <TrendingDown className="h-4 w-4" />
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Remaining Balance</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tighter ${financials.balance && financials.balance !== '₱0.00' ? 'text-red-600' : 'text-emerald-600'}`}>
              {financials.balance || '₱0.00'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className={`h-1 w-1 rounded-full ${financials.balance && financials.balance !== '₱0.00' ? 'bg-red-500' : 'bg-emerald-500'}`} />
            Total unpaid amount
          </div>
        </div>
      </div>
    </div>
  );
}
