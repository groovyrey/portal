'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
}

export default function Drawer({ isOpen, onClose, title, children, side = 'right' }: DrawerProps) {
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
  const isLeft = side === 'left';

  let positionClasses = '';
  if (isBottom) {
    positionClasses = 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-xl border-t';
  } else if (isLeft) {
    positionClasses = 'left-0 top-0 bottom-0 w-full max-w-[300px] border-r';
  } else {
    positionClasses = 'right-0 top-0 bottom-0 w-full max-w-md border-l';
  }

  return (
    <>
      {isOpen && (
        <>
          <div
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/35 transition-opacity"
          />

          <div
            className={`fixed z-[160] flex flex-col bg-card border-border shadow-lg ${positionClasses}`}
          >
            {isBottom && (
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            )}

            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className={isBottom ? 'max-w-2xl mx-auto' : ''}>{children}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
