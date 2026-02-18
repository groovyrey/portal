'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'right' | 'bottom';
}

export default function Drawer({ isOpen, onClose, title, children, side = 'right' }: DrawerProps) {
  // Prevent scrolling when drawer is open
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

  const isBottom = side === 'bottom';

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 z-[150]"
          />
          
          {/* Drawer Panel */}
          <div
            className={`fixed bg-white shadow-2xl z-[160] flex flex-col transition-transform duration-200 ${
              isBottom 
                ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl translate-y-0' 
                : 'right-0 top-0 bottom-0 w-full max-w-md translate-x-0'
            }`}
          >
            {isBottom && (
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            )}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className={isBottom ? 'max-w-2xl mx-auto' : ''}>
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
