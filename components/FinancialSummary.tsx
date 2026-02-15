import { Financials } from '../types';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 hover:shadow-md">
        <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Total Assessment</h3>
        <p className="text-2xl md:text-3xl font-bold text-slate-800">{financials.total || '---'}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 hover:shadow-md">
        <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Outstanding Balance</h3>
        <p className="text-2xl md:text-3xl font-bold text-red-600">{financials.balance || '---'}</p>
      </div>
    </div>
  );
}
