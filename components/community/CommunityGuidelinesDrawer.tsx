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
    description: "The LCC Portal is an academic space. Use professional language and avoid excessive slang, all-caps, or offensive content."
  },
  {
    icon: <HeartHandshake className="h-5 w-5 text-rose-500" />,
    title: "Support Your Peers",
    description: "Encourage others. Sharing study tips, notes, or supportive comments creates a better learning environment for everyone."
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    title: "No Bullying or Shaming",
    description: "Zero tolerance for harassment. Never mock someone for their grades, course, or questions. AI review will block toxic content."
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
    title: "Privacy Matters",
    description: "Never share your Student ID, password, phone number, or home address. Do not post private details about others."
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
    title: "Stay Relevant",
    description: "Categorize your posts correctly using topics. Avoid spamming the feed with repetitive or non-academic content."
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
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-3 mb-2 text-slate-900">
            <Info className="h-5 w-5" />
            <h3 className="font-bold text-sm">Why have guidelines?</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            To ensure the LCC Community remains a safe and productive space for all students, every post is reviewed by Aegis using these standards.
          </p>
        </div>

        <div className="space-y-6">
          {GUIDELINES.map((item, idx) => (
            <div key={idx} className="flex gap-4 group">
                                <div className="shrink-0 h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:opacity-80 transition-opacity">                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
            Let&apos;s build a better LCC together
          </p>
        </div>
      </div>
    </Drawer>
  );
}
