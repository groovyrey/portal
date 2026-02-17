'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, X, ArrowRight, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';

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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!result && !isError) return null;

  const isApproved = result?.decision === 'APPROVED';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative"
          >
            <div className="p-8 flex flex-col items-center text-center">
              {/* Icon */}
              <div className={`mb-6 p-4 rounded-2xl ${
                isError ? 'bg-amber-50 text-amber-600' :
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

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {isError ? 'Review Skipped' : isApproved ? 'Post Approved' : 'Post Rejected'}
              </h2>
              
              <p className="text-sm text-slate-500 mb-6 px-2 font-medium leading-relaxed">
                {isError 
                  ? "We couldn't complete the AI review due to a technical error. Your post has been shared but is marked for later review." 
                  : result?.reason}
              </p>

              {/* Growth Tip Box */}
              {!isError && result?.growth_tip && (
                <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Growth Tip</span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                    "{result.growth_tip}"
                  </p>
                </div>
              )}

              {/* Safety Score (Optional display) */}
              {!isError && (
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety Score:</span>
                  <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
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

            {/* Close Icon (Top Right) */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
