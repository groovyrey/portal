'use client';

import { Loader2 } from 'lucide-react';
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
      className="p-6 flex flex-col items-center text-center"
    >
      <div className="py-8 flex flex-col items-center max-w-xs mx-auto">
        <div className="mb-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>

        <h2 className="text-lg font-bold text-foreground mb-2">Syncing Portal</h2>
        <p className="text-sm text-muted-foreground">
          Fetching your latest academic data.
        </p>

        <div className="mt-8 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
          Please wait...
        </div>
      </div>
    </Modal>
  );
}
