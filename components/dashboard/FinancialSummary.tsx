import { Financials } from '@/types';
import { Clock, CreditCard, TrendingDown } from 'lucide-react';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div className="surface-neutral p-6 rounded-xl border border-border/50 shadow-sm group hover:border-primary/30 transition-all duration-300 overflow-hidden relative">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary border border-primary/10">
            <CreditCard className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Total Assessment</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-foreground tracking-tight tabular-nums">
            {financials.total || '₱0.00'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <div className="h-1 w-1 rounded-full bg-primary/30" />
          Current Cycle
        </div>
      </div>

      <div className="surface-neutral p-6 rounded-xl border border-border/50 shadow-sm group hover:border-orange-500/30 transition-all duration-300 overflow-hidden relative">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-500/10 p-2.5 rounded-lg text-orange-600 border border-orange-500/10">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Due Today</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black tracking-tight tabular-nums ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'text-orange-600' : 'text-foreground'}`}>
            {financials.dueToday || '₱0.00'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <div className={`h-1 w-1 rounded-full ${financials.dueToday && financials.dueToday !== '₱0.00' ? 'bg-orange-500' : 'bg-primary/30'}`} />
          Outstanding
        </div>
      </div>

      <div className="surface-neutral p-6 rounded-xl border border-border/50 shadow-sm group hover:border-red-500/30 transition-all duration-300 sm:col-span-2 lg:col-span-1 overflow-hidden relative">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/5 blur-3xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500/10 p-2.5 rounded-lg text-red-600 border border-red-500/10">
            <TrendingDown className="h-4 w-4" />
          </div>
          <h3 className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Remaining Balance</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black tracking-tight tabular-nums ${financials.balance && financials.balance !== '₱0.00' ? 'text-red-600' : 'text-emerald-600'}`}>
            {financials.balance || '₱0.00'}
          </span>
        </div>
        <div className="mt-4">
          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest w-fit border ${
            financials.balance && financials.balance !== '₱0.00' 
              ? 'bg-red-500/10 text-red-600 border-red-500/10' 
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10'
          }`}>
            {financials.balance && financials.balance !== '₱0.00' ? 'Unpaid' : 'Settled'}
          </div>
        </div>
      </div>
    </div>
  );
}
