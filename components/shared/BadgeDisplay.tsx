'use client';

import React, { useState } from 'react';
import { BADGES } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { ShieldCheck, Award, Star, Shield, CheckCircle2, MessageSquare, Beaker, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Award,
  Star,
  Shield,
  CheckCircle2,
  MessageSquare,
  Beaker,
  Sparkles
};

interface BadgeDisplayProps {
  badgeIds: string[] | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
}

const COLOR_SCHEMES: Record<string, { bg: string; text: string; ring: string }> = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500/25 via-blue-500/10 to-indigo-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/25',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-400/25 via-amber-400/10 to-orange-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/25',
  },
  slate: {
    bg: 'bg-gradient-to-br from-slate-400/25 via-slate-400/10 to-slate-500/15',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-400/25',
  },
};

const DEFAULT_SCHEME = COLOR_SCHEMES.slate;

export default function BadgeDisplay({ badgeIds, size = 'md', showName = false, onClick }: BadgeDisplayProps) {
  const [activeBadge, setActiveBadge] = useState<any>(null);

  if (!badgeIds || badgeIds.length === 0) return null;

  const userBadges = badgeIds
    .map(id => BADGES[id])
    .filter(Boolean);

  if (userBadges.length === 0) return null;

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const nameClasses = {
    sm: 'text-[11px]',
    md: 'text-sm',
    lg: 'text-base',
  };

  const MAX_DISPLAY = 4;
  const displayBadges = userBadges.slice(0, MAX_DISPLAY);
  const remainingCount = userBadges.length - MAX_DISPLAY;

  const openBadge = (badge: any) => {
    setActiveBadge(badge);
  };

  return (
    <>
      <div
        className={cn('flex items-center gap-2.5', onClick && 'cursor-pointer active:scale-95 transition-transform')}
        onClick={onClick}
      >
        <div className="flex -space-x-2">
          {displayBadges.map((badge) => {
            const Icon = ICON_MAP[badge.icon || 'Award'] || Award;
            const scheme = COLOR_SCHEMES[badge.color] || DEFAULT_SCHEME;

            return (
              <button
                type="button"
                key={badge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openBadge(badge);
                }}
                className="relative group z-0 hover:z-10 focus-visible:z-10 focus:outline-none cursor-pointer"
                aria-label={badge.name}
              >
                <div
                  className={cn(
                    `${sizeClasses[size]} rounded-full flex items-center justify-center ring-2 ring-background shadow-md ${scheme.bg} ${scheme.text} ${scheme.ring}`,
                    'transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:shadow-lg active:scale-95'
                  )}
                >
                  <Icon className={cn(iconSizeClasses[size], 'drop-shadow-sm')} />
                </div>

                {/* Tooltip (desktop hover) */}
                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mb-2 px-2.5 py-1.5 bg-popover/95 backdrop-blur-sm text-popover-foreground text-[10px] leading-tight rounded-lg border border-border shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-150 whitespace-nowrap z-50">
                  <span className="block font-bold">{badge.name}</span>
                  {badge.description && (
                    <span className="block text-muted-foreground mt-0.5">{badge.description}</span>
                  )}
                </div>
              </button>
            );
          })}

          {remainingCount > 0 && (
            <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ring-2 ring-background bg-gradient-to-br from-muted to-muted/60 text-muted-foreground font-bold shadow-md`}>
              +{remainingCount}
            </div>
          )}
        </div>

        {showName && userBadges.length === 1 && (
          <span className={cn('font-semibold', nameClasses[size], badgeIds.includes('staff') ? 'staff-gradient-text' : 'text-muted-foreground')}>
            {userBadges[0].name}
          </span>
        )}
      </div>

      <Dialog open={!!activeBadge} onOpenChange={(open) => !open && setActiveBadge(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            {activeBadge && (() => {
              const Icon = ICON_MAP[activeBadge.icon || 'Award'] || Award;
              const scheme = COLOR_SCHEMES[activeBadge.color] || DEFAULT_SCHEME;
              return (
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    'h-16 w-16 rounded-full flex items-center justify-center ring-4 ring-background shadow-xl',
                    scheme.bg,
                    scheme.text,
                    scheme.ring
                  )}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <DialogTitle className="text-xl">{activeBadge.name}</DialogTitle>
                </div>
              );
            })()}
          </DialogHeader>
          <DialogDescription className="text-center text-sm">
            {activeBadge?.description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
