'use client';

import { ShieldCheck } from 'lucide-react';
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
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col items-center text-center px-8 py-10 sm:py-12">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/10" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary/40" />
          </div>
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">Signing in…</h2>
        <p className="mt-1 text-sm text-muted-foreground">Fetching your official records.</p>
      </div>
    </Modal>
  );
}
