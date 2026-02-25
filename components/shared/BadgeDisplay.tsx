'use client';

import React from 'react';
import { BADGES } from '@/lib/badges';
import { ShieldCheck, Award, Star, Shield, CheckCircle2 } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Award,
  Star,
  Shield,
  CheckCircle2
};

interface BadgeDisplayProps {
  badgeIds: string[] | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function BadgeDisplay({ badgeIds, size = 'md', showName = false }: BadgeDisplayProps) {
  if (!badgeIds || badgeIds.length === 0) return null;

  const userBadges = badgeIds
    .map(id => BADGES[id])
    .filter(Boolean);

  if (userBadges.length === 0) return null;

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {userBadges.map((badge) => {
        const Icon = ICON_MAP[badge.icon || 'Award'] || Award;
        
        // Simple color mapping
        const colorStyles = badge.color === 'blue' 
          ? 'bg-blue-50 text-blue-600 border-blue-100' 
          : 'bg-slate-50 text-slate-600 border-slate-100';

        return (
          <div 
            key={badge.id}
            className={`inline-flex items-center font-black uppercase tracking-[0.1em] rounded-lg border ${colorStyles} ${sizeClasses[size]}`}
            title={badge.description}
          >
            <Icon className={iconSizeClasses[size]} />
            {showName && <span>{badge.name}</span>}
          </div>
        );
      })}
    </div>
  );
}
