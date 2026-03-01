'use client';

import React from 'react';
import { BADGES } from '@/lib/badges';
import { ShieldCheck, Award, Star, Shield, CheckCircle2, MessageSquare, Beaker } from 'lucide-react';
import { Avatar, AvatarGroup, Tooltip } from '@mui/material';

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

  const sizePx = {
    sm: 24,
    md: 32,
    lg: 40,
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

  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
    >
      <AvatarGroup 
        max={4}
        sx={{
          '& .MuiAvatar-root': { 
            width: sizePx[size], 
            height: sizePx[size], 
            fontSize: sizePx[size] / 2.5,
            border: '2px solid white',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          },
        }}
      >
        {userBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon || 'Award'] || Award;
          
          // Simple color mapping
          let bgColor = '#f8fafc'; // slate-50
          let iconColor = '#64748b'; // slate-500

          if (badge.color === 'blue') {
            bgColor = '#eff6ff'; // blue-50
            iconColor = '#2563eb'; // blue-600
          } else if (badge.color === 'amber') {
            bgColor = '#fffbeb'; // amber-50
            iconColor = '#d97706'; // amber-600
          }

          return (
            <Tooltip key={badge.id} title={badge.description || badge.name} arrow>
              <Avatar 
                sx={{ 
                  bgcolor: bgColor,
                  color: iconColor,
                }}
              >
                <Icon className={iconSizeClasses[size]} />
              </Avatar>
            </Tooltip>
          );
        })}
      </AvatarGroup>
      
      {showName && userBadges.length === 1 && (
        <span className={`font-black uppercase tracking-[0.1em] ${badgeIds.includes('staff') ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'} ${nameClasses[size]}`}>
          {userBadges[0].name}
        </span>
      )}
    </div>
  );
}
