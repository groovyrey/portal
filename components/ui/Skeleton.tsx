'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export default function Skeleton({ className, variant = 'rounded' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-3 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  };

  return (
    <div 
      className={`
        relative overflow-hidden 
        bg-secondary/70 
        ${variantClasses[variant]} 
        ${className}
      `}
    >
      <motion.div
        animate={{
          translateX: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          width: '50%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
