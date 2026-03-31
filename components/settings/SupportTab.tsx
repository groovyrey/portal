'use client';

import React from 'react';
import { 
  Star, 
  Shield, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  BookOpen,
  LifeBuoy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/ui/StarRating';

export default function SupportTab() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="surface-violet relative overflow-hidden flex items-center gap-4 p-6 rounded-2xl border border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400 opacity-70" />
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <LifeBuoy className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground leading-tight">Help & Support</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Get assistance and share your feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="surface-amber rounded-2xl border border-border/80 p-6 shadow-sm flex flex-col items-center text-center ring-1 ring-black/5 dark:ring-white/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                <Star className="h-6 w-6 text-amber-500" />
            </div>
            <h4 className="font-bold text-base text-foreground mb-2">Rate LCC Hub</h4>
            <p className="text-xs text-muted-foreground font-medium mb-6">Your feedback helps us improve the experience for everyone.</p>
            <div className="w-full bg-accent/50 p-4 rounded-xl border border-border">
                <StarRating onSuccess={() => {}} />
            </div>
        </div>

        <div className="space-y-4">
            <SupportItem 
                icon={<BookOpen />} 
                title="Help Center" 
                description="Browse documentation and FAQs"
                onClick={() => router.push('/docs')}
            />
            <SupportItem 
                icon={<MessageSquare />} 
                title="Community Guidelines" 
                description="Read our platform rules"
                onClick={() => {}}
            />
            <SupportItem 
                icon={<Shield />} 
                title="Privacy Policy" 
                description="How we handle your data"
                onClick={() => {}}
            />
        </div>
      </div>
    </div>
  );
}

function SupportItem({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 surface-neutral hover:bg-accent/50 rounded-2xl border border-border/80 transition-all group shadow-sm ring-1 ring-black/5 dark:ring-white/10"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white to-slate-100 dark:from-card dark:to-slate-900 flex items-center justify-center border border-border group-hover:bg-card transition-colors">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: "text-primary" }) : icon}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none mb-1">{title}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </button>
  );
}
