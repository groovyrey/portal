'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'bottom' | 'top';
}

export default function Drawer({ isOpen, onClose, title, children, side = 'right' }: DrawerProps) {
  const isBottom = side === 'bottom';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={side} className={cn(
        "p-0 flex flex-col gap-0 sm:max-w-md",
        isBottom && "sm:max-w-none rounded-t-xl"
      )}>
        {isBottom && (
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />
        )}
        <SheetHeader className="p-4 border-b border-border space-y-0">
          <SheetTitle className="text-base font-semibold text-foreground">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className={isBottom ? 'max-w-2xl mx-auto' : ''}>
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
