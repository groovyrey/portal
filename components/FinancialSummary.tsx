import { Financials } from '../types';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 transition-transform hover:shadow-md group">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left flex-1 w-full">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Assessment</h3>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{financials.total || '---'}</p>
        </div>
        
        <div className="hidden sm:block h-12 w-px bg-slate-100"></div>
        <div className="sm:hidden w-full h-px bg-slate-100"></div>

        <div className="text-center sm:text-right flex-1 w-full">
          <div className="flex items-center gap-2 justify-center sm:justify-end mb-2">
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest order-2 sm:order-1">Outstanding Balance</h3>
            <div className="bg-red-50 p-1.5 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors order-1 sm:order-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tight">{financials.balance || '---'}</p>
        </div>
      </div>
    </div>
  );
}
