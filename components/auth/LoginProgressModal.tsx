'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface LoginProgressModalProps {
  isOpen: boolean;
}

export default function LoginProgressModal({ isOpen }: LoginProgressModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      showCloseButton={false}
      noPadding
    >
      <div className="flex flex-col items-center text-center p-10 sm:p-12">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
          <div className="relative h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">Accessing Portal</h2>
        <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
          Securely fetching your official records from the Schoolista system.
        </p>

        <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-muted rounded-full border border-border/50">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Safe & Secure
          </span>
        </div>
      </div>
    </Modal>
  );
}
