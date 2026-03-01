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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`mb-6 p-4 rounded-2xl ${
          isError ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
          isApproved ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isError ? (
            <ShieldAlert className="h-10 w-10" />
          ) : isApproved ? (
            <ShieldCheck className="h-10 w-10" />
          ) : (
            <ShieldAlert className="h-10 w-10" />
          )}
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {isError ? 'Review Skipped' : isApproved ? 'Post Approved' : 'Post Rejected'}
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6 px-2 font-medium leading-relaxed">
          {isError 
            ? "We couldn't complete the review due to a technical error. Your post has been shared but is marked for later review." 
            : result?.reason}
        </p>

        {/* Growth Tip Box */}
        {!isError && result?.growth_tip && (
          <div className="w-full bg-accent rounded-2xl p-5 mb-8 text-left border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Growth Tip</span>
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
                className={`h-full transition-all duration-1000 ${isApproved ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${result?.safety_score}%` }}
              />
            </div>
            <span className={`text-[10px] font-black ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
              {result?.safety_score}%
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
            isError ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20' :
            isApproved ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' : 
            'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
          }`}
        >
          {isApproved || isError ? 'Got it, thanks!' : 'I understand'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Modal>
  );
}
