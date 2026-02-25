'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface LoginProgressModalProps {
  isOpen: boolean;
}

const SYNC_STEPS = [
  "Connecting to school portal",
  "Authenticating credentials",
  "Syncing academic profile",
  "Parsing class schedule",
  "Fetching financial records",
  "Finalizing synchronization"
];

export default function LoginProgressModal({ isOpen }: LoginProgressModalProps) {
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
        if (prev < SYNC_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const progress = ((currentStep + 1) / SYNC_STEPS.length) * 100;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      showCloseButton={false}
      className="p-8 flex flex-col items-center text-center"
    >
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
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Syncing your Portal</h2>
      <p className="text-sm text-slate-500 mb-8 px-4 leading-relaxed">
        We are securely fetching your real-time data from Schoolista.
      </p>

      {/* Steps List */}
      <div className="w-full space-y-4 text-left">
        {SYNC_STEPS.map((step, i) => {
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

      <div className="mt-10 pt-6 border-t border-slate-100 w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Please stay on this page
      </div>
    </Modal>
  );
}
