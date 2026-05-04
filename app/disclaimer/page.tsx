import React from 'react';
import DisclaimerContent from '@/components/shared/DisclaimerContent';
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Legal notice and data synchronization policy for LCC Hub.',
};

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <DisclaimerContent />

        <Separator className="mt-16 mb-8" />
        
        <footer className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p className="font-medium">
            LCC Hub is an unofficial student portal.
          </p>
          <p>
            &copy; {new Date().getFullYear()} Community Driven
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
