'use client';

import Link from 'next/link';
import { 
  GraduationCap, 
  Calendar, 
  Wallet, 
  MessageSquare, 
  BookOpen,
  LayoutGrid,
  BrainCircuit,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { 
    label: 'Academic Grades', 
    icon: GraduationCap, 
    href: '/grades', 
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    card: 'bg-card'
  },
  { 
    label: 'Study Mode',
    icon: BrainCircuit,
    href: '/study-mode',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    card: 'bg-card'
  },
  {
    label: 'Quest Center',
    icon: Trophy,
    href: '/quests',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    card: 'bg-card'
  },
  { 
    label: 'Class Schedule', 
    icon: Calendar, 
    href: '/', 
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    card: 'bg-card'
  },
  { 
    label: 'Financial Registry', 
    icon: Wallet, 
    href: '/accounts', 
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    card: 'bg-card'
  },
  { 
    label: 'Community Hub', 
    icon: MessageSquare, 
    href: '/community', 
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    card: 'bg-card'
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

export default function QuickActions() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="h-6 w-6 rounded-md bg-foreground text-background flex items-center justify-center">
          <LayoutGrid className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Quick Access</h3>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
      >
        {actions.map((action, idx) => (
          <Link key={idx} href={action.href} className="block group">
            <motion.div 
              variants={item}
              className={`h-full border border-border p-3 rounded-xl transition-all duration-300 active:scale-95 flex flex-col items-center text-center gap-2.5 shadow-sm hover:shadow-md ${action.card}`}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground leading-tight">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
