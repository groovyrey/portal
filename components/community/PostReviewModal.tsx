'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PostReviewModalProps {
  isOpen: boolean;
}

const REVIEW_STEPS = [
  "Analyzing content safety",
  "Checking community guidelines",
  "Scanning for academic integrity",
  "Finalizing decision"
];

export default function PostReviewModal({ isOpen }: PostReviewModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset current step when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setCurrentStep(0), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < REVIEW_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const progress = ((currentStep + 1) / REVIEW_STEPS.length) * 100;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      showCloseButton={false}
      className="p-8 flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />

      {/* Progress Animation */}
      <div className="relative mb-8 flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={251.2}
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
            className="text-blue-600"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-blue-600" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Review in Progress</h2>
      <p className="text-sm text-slate-500 mb-8 px-4 leading-relaxed font-medium">
        We're ensuring our community stays safe and professional for all students.
      </p>

      {/* Timeline List */}
      <div className="w-full relative px-2">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

        <div className="space-y-8 relative">
          {REVIEW_STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;

            return (
              <div key={i} className="flex items-start gap-6 group">
                {/* Timeline Dot */}
                <div className="relative z-10 flex items-center justify-center shrink-0 mt-1">
                  {isCompleted ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-9 w-9 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.div>
                  ) : isActive ? (
                    <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 ring-4 ring-blue-50">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                      <div className="h-2 w-2 bg-slate-200 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left pt-1.5">
                  <h4 className={`text-sm font-black uppercase tracking-widest transition-colors duration-500 ${
                    isCompleted ? 'text-slate-400' : 
                    isActive ? 'text-blue-600' : 'text-slate-300'
                  }`}>
                    {step}
                  </h4>
                  {isActive && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-wider"
                    >
                      Processing request...
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
