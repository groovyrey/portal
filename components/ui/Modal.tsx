'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-sm',
  className = '',
  showCloseButton = true
}: ModalProps) {
  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCloseButton) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, showCloseButton]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-[700]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 dark:bg-card/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Scrollable Container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
              {/* Click handler for backdrop behavior on the wrapper */}
              <div 
                className="absolute inset-0" 
                onClick={() => showCloseButton && onClose()} 
              />

              {/* Modal Panel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`relative w-full ${maxWidth} bg-card rounded-3xl shadow-2xl overflow-hidden border border-border text-left align-middle ${className}`}
                onClick={(e) => e.stopPropagation()}
              >
                {title && (
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex-1">{title}</div>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 ml-2 bg-accent hover:bg-accent text-muted-foreground hover:text-muted-foreground rounded-xl transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                {!title && showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-accent/20 hover:bg-accent/40 text-muted-foreground rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="relative flex-1 flex flex-col">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
