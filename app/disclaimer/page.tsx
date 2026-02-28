import React from 'react';
import DisclaimerContent from '@/components/shared/DisclaimerContent';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-accent text-foreground pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <DisclaimerContent />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            LCC Hub • Unofficial Notice
          </p>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} • Community Driven
          </p>
        </footer>
      </div>
    </div>
  );
  }
;

export default DisclaimerPage;
