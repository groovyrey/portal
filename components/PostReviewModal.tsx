'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, ShieldCheck } from 'lucide-react';

interface PostReviewModalProps {
  isOpen: boolean;
}

const REVIEW_STEPS = [
  "Analyzing content safety",
  "Checking community guidelines",
  "Scanning for academic integrity",
  "Finalizing AI decision"
];

export default function PostReviewModal({ isOpen }: PostReviewModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setCurrentStep(0);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden"
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

            <h2 className="text-xl font-bold text-slate-900 mb-2">AI Review in Progress</h2>
            <p className="text-sm text-slate-500 mb-8 px-4 leading-relaxed font-medium">
              We're ensuring our community stays safe and professional for all students.
            </p>

            {/* Steps List */}
            <div className="w-full space-y-4 text-left">
              {REVIEW_STEPS.map((step, i) => {
                const isCompleted = i < currentStep;
                const isActive = i === currentStep;

                return (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="shrink-0 transition-all duration-500">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : isActive ? (
                        <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-200" />
                      )}
                    </div>
                    <span className={`text-sm font-bold transition-colors duration-500 ${
                      isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 
                      isActive ? 'text-blue-600' : 'text-slate-300'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Analyzing your thoughts...
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
