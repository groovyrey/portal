'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export default function Skeleton({ className, variant = 'rounded' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-3 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`bg-slate-200 ${variantClasses[variant]} ${className}`}
    />
  );
}
