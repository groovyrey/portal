import { Financials } from '@/types';
import { Wallet, Clock, AlertCircle, CreditCard, ArrowUpRight, TrendingDown } from 'lucide-react';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm group hover:border-muted-foreground transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600 border border-blue-100">
            <CreditCard className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Total Assessment</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground tracking-tight">
            {financials.total || '₱0.00'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          Current Cycle
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm group hover:border-muted-foreground transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-50 p-2 rounded-lg text-orange-600 border border-orange-100">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Due Today</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tracking-tight ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'text-orange-600' : 'text-foreground'}`}>
            {financials.dueToday || '₱0.00'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className={`h-1 w-1 rounded-full ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'bg-orange-500' : 'bg-slate-300'}`} />
          Outstanding
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm group hover:border-muted-foreground transition-all duration-300 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-50 p-2 rounded-lg text-red-600 border border-red-100">
            <TrendingDown className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Remaining Balance</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tracking-tight ${financials.balance && financials.balance !== '₱0.00' ? 'text-red-600' : 'text-emerald-600'}`}>
            {financials.balance || '₱0.00'}
          </span>
        </div>
        <div className="mt-4">
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit border ${
            financials.balance && financials.balance !== '₱0.00' 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {financials.balance && financials.balance !== '₱0.00' ? 'Unpaid' : 'Settled'}
          </div>
        </div>
      </div>
    </div>
  );
}
