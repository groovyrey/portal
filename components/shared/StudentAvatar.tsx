'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StudentAvatarProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export default function StudentAvatar({ name, photoUrl, className, fallbackClassName }: StudentAvatarProps) {
  const letter = name && name[0] ? name[0].toUpperCase() : '?';
  return (
    <Avatar className={cn('h-10 w-10', className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt={name} className="object-cover" /> : null}
      <AvatarFallback className={cn('text-sm font-bold', fallbackClassName)}>{letter}</AvatarFallback>
    </Avatar>
  );
}
