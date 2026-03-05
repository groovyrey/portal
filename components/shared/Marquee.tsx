'use client';

import { motion } from 'framer-motion';
import { Student } from '@/types';

interface MarqueeProps {
  subjects: { 
    description: string;
    icon?: React.ElementType;
  }[];
  className?: string;
}

export default function Marquee({ subjects, className = "" }: MarqueeProps) {
  if (!subjects || subjects.length === 0) return null;

  return (
    <div className={`relative overflow-hidden pointer-events-none opacity-80 dark:opacity-90 py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}>
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          duration: 120, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex whitespace-nowrap items-center w-fit"
      >
        {/* Double the content for seamless looping */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-20 pr-20">
            {subjects.map((item, idx) => {
              const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
              const fonts = [
                'font-black tracking-tighter italic', 
                'font-bold tracking-[0.3em]', 
                'font-medium tracking-tight', 
                'font-black tracking-widest uppercase',
                'font-light tracking-[0.5em] uppercase'
              ];
              const styleIdx = idx % fonts.length;
              const colorIdx = idx % colors.length;
              const randomColor = colors[colorIdx];
              const randomStyle = fonts[styleIdx];
              const Icon = item.icon;

              return (
                <div key={idx} className="flex items-center gap-4">
                  {Icon && <Icon className="h-8 w-8 sm:h-12 sm:w-12" style={{ color: randomColor }} />}
                  <span 
                    className={`text-3xl sm:text-7xl uppercase ${randomStyle}`}
                    style={{ 
                      color: randomColor,
                      textShadow: `2px 2px 0px ${randomColor}44`
                    }}
                  >
                    {item.description}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
