'use client';

import { ShieldCheck, Info, MessageSquare, AlertTriangle, GraduationCap, HeartHandshake } from 'lucide-react';
import Drawer from '@/components/layout/Drawer';
import { Separator } from '@/components/ui/separator';

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
      <div className="space-y-6 pb-8">
        <div className="bg-muted p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2 text-foreground">
            <Info className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Why have guidelines?</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To ensure the LCCians Community remains a safe and productive space for all students, every post is reviewed for compliance with these standards.
          </p>
        </div>

        <div className="space-y-6">
          {GUIDELINES.map((item, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="shrink-0 h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center transition-colors">
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center">
            Let&apos;s build a better LCC together
          </p>
        </div>
      </div>
    </Drawer>
  );
}
