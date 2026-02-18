import React from 'react';
import DisclaimerContent from '@/components/DisclaimerContent';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <DisclaimerContent />

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-slate-200" />
              <span className="text-xs font-bold uppercase tracking-widest">LCC Hub Official Notice</span>
            </div>
            <p className="text-[10px] font-medium text-center md:text-right uppercase tracking-tighter">
              &copy; {new Date().getFullYear()} — Built for Students by Students. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
