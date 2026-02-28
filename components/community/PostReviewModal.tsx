'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PostReviewModalProps {
  isOpen: boolean;
}

export default function PostReviewModal({ isOpen }: PostReviewModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      showCloseButton={false}
      className="p-8 flex flex-col items-center text-center relative overflow-hidden"
    >
      <div className="py-12 flex flex-col items-center max-w-xs mx-auto">
        {/* Animated Icon */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
          <div className="relative bg-card p-6 rounded-3xl border border-border shadow-xl">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-3">Post Review</h2>
        
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            AI is analyzing your content to ensure it follows our community guidelines.
          </p>
          
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-1.5 h-1.5 bg-blue-600 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border w-full text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
          Community Safety First
        </div>
      </div>
    </Modal>
  );
}
