'use client';

import { ShieldCheck, Info, MessageSquare, AlertTriangle, GraduationCap, HeartHandshake } from 'lucide-react';
import Drawer from '@/components/layout/Drawer';

interface CommunityGuidelinesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDELINES = [
  {
    icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
    title: "Be Professional",
    description: "The LCCians Community is a space for all students. Use respectful language and avoid offensive content or excessive slang."
  },
  {
    icon: <HeartHandshake className="h-5 w-5 text-rose-500" />,
    title: "Support Your Peers",
    description: "Encourage others. Sharing study tips, notes, or supportive comments creates a better environment for everyone."
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    title: "No Bullying or Shaming",
    description: "Zero tolerance for harassment. Never mock someone for their questions or course. Toxic content will be removed."
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
    title: "Privacy Matters",
    description: "Never share your Student ID, password, phone number, or home address. Do not post private details about others."
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
    title: "Stay Relevant",
    description: "Categorize your posts correctly using topics. Avoid spamming the community with repetitive or irrelevant content."
  }
];

export default function CommunityGuidelinesDrawer({ isOpen, onClose }: CommunityGuidelinesDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Community Guidelines"
      side="right"
    >
      <div className="space-y-8 pb-10">
        <div className="bg-accent rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2 text-foreground">
            <Info className="h-5 w-5" />
            <h3 className="font-bold text-sm">Why have guidelines?</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            To ensure the LCCians Community remains a safe and productive space for all students, every post is reviewed for compliance with these standards.
          </p>
        </div>

        <div className="space-y-6">
          {GUIDELINES.map((item, idx) => (
            <div key={idx} className="flex gap-4 group">
                                <div className="shrink-0 h-10 w-10 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center group-hover:opacity-80 transition-opacity">                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">
            Let&apos;s build a better LCC together
          </p>
        </div>
      </div>
    </Drawer>
  );
}
