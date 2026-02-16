import { Financials } from '../types';
import { Wallet, Clock, AlertCircle } from 'lucide-react';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Assessment</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{financials.total || '---'}</p>
        </div>
        
        <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Due Today</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600 tracking-tight">{financials.dueToday || '---'}</p>
        </div>

        <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Balance</h3>
          </div>
          <p className="text-2xl font-bold text-red-600 tracking-tight">{financials.balance || '---'}</p>
        </div>
      </div>
    </div>
  );
}
