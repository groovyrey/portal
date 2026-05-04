'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showCloseButton?: boolean;
  noPadding?: boolean;
}

/**
 * Standardized Modal component built on top of shadcn/ui Dialog.
 * Gain accessibility features like focus trapping and ESC-to-close automatically.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  showCloseButton = true,
  noPadding = false
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 overflow-hidden border-border bg-card shadow-2xl sm:rounded-2xl w-[95vw] max-h-[90vh] flex flex-col fixed",
          maxWidth,
          className
        )}
        hideClose={!showCloseButton}
        onPointerDownOutside={(e) => !showCloseButton && e.preventDefault()}
        onEscapeKeyDown={(e) => !showCloseButton && e.preventDefault()}
      >
        {title && (
          <DialogHeader className="p-6 border-b border-border/50 space-y-0 shrink-0">
            {typeof title === 'string' ? (
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {title}
              </DialogTitle>
            ) : (
              <div className="flex-1">{title}</div>
            )}
          </DialogHeader>
        )}

        <div className={cn(
          "flex-1 overflow-y-auto min-h-0",
          !noPadding && "p-6"
        )}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
