'use client';

import React from 'react';
import { BADGES } from '@/lib/badges';
import { ShieldCheck, Award, Star, Shield, CheckCircle2, MessageSquare, Beaker } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Award,
  Star,
  Shield,
  CheckCircle2,
  MessageSquare,
  Beaker
};

interface BadgeDisplayProps {
  badgeIds: string[] | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
}

export default function BadgeDisplay({ badgeIds, size = 'md', showName = false, onClick }: BadgeDisplayProps) {
  if (!badgeIds || badgeIds.length === 0) return null;

  const userBadges = badgeIds
    .map(id => BADGES[id])
    .filter(Boolean);

  if (userBadges.length === 0) return null;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-8 h-8 text-[12px]',
    lg: 'w-10 h-10 text-[14px]',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const nameClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  const MAX_DISPLAY = 4;
  const displayBadges = userBadges.slice(0, MAX_DISPLAY);
  const remainingCount = userBadges.length - MAX_DISPLAY;

  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex -space-x-2">
        {displayBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon || 'Award'] || Award;
          
          let bgColor = 'bg-muted';
          let textColor = 'text-muted-foreground';

          if (badge.color === 'blue') {
            bgColor = 'bg-blue-500/10';
            textColor = 'text-blue-500';
          } else if (badge.color === 'amber') {
            bgColor = 'bg-amber-500/10';
            textColor = 'text-amber-500';
          }

          return (
            <div 
              key={badge.id}
              className={`relative group z-0 hover:z-10`}
            >
              <div 
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-background shadow-sm overflow-hidden ${bgColor} ${textColor} transition-transform hover:scale-110`}
              >
                <Icon className={iconSizeClasses[size]} />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border border-border shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {badge.description || badge.name}
              </div>
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-background bg-muted text-muted-foreground font-bold shadow-sm z-0`}>
            +{remainingCount}
          </div>
        )}
      </div>
      
      {showName && userBadges.length === 1 && (
        <span className={`font-black uppercase tracking-[0.1em] ${badgeIds.includes('staff') ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/80 dark:text-muted-foreground'} ${nameClasses[size]}`}>
          {userBadges[0].name}
        </span>
      )}
    </div>
  );
}
