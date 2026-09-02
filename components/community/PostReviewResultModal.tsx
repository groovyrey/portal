'use client';

import { ShieldCheck, ShieldAlert, ArrowRight, Lightbulb } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PostReviewResult {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  growth_tip: string;
  safety_score: number;
}

interface PostReviewResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PostReviewResult | null;
  isError?: boolean;
}

export default function PostReviewResultModal({ isOpen, onClose, result, isError }: PostReviewResultModalProps) {
  if (!isOpen) return null;
  if (!result && !isError) return null;

  const isApproved = result?.decision === 'APPROVED';

  return (
    <Modal isOpen={isOpen} onClose={onClose} noPadding>
      <div className="p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`mb-6 p-4 rounded-2xl ${
          isError ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
          isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          {isError ? (
            <ShieldAlert className="h-10 w-10" />
          ) : isApproved ? (
            <ShieldCheck className="h-10 w-10" />
          ) : (
            <ShieldAlert className="h-10 w-10" />
          )}
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-2">
          {isError ? 'Review Skipped' : isApproved ? 'Post Approved' : 'Post Rejected'}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6 px-2 font-medium leading-relaxed">
          {isError 
            ? "We couldn't complete the review due to a technical error. Your post has been shared but is marked for later review." 
            : result?.reason}
        </p>

        {/* Growth Tip Box */}
        {!isError && result?.growth_tip && (
          <div className="w-full bg-muted rounded-lg p-5 mb-6 text-left border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Growth Tip</span>
            </div>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed italic">
              &quot;{result.growth_tip}&quot;
            </p>
          </div>
        )}

        {/* Safety Score (Optional display) */}
        {!isError && (
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Safety Score:</span>
            <div className="h-1.5 w-24 bg-accent rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${result?.safety_score}%` }}
              />
            </div>
            <span className={`text-[10px] font-black ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {result?.safety_score}%
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            isError ? 'bg-amber-600 hover:bg-amber-700 text-white' :
            isApproved ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 
            'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {isApproved || isError ? 'Got it, thanks!' : 'I understand'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Modal>
  );
}
