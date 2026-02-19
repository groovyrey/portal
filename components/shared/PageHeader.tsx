'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings, 
  FileText, 
  GraduationCap, 
  WalletCards, 
  BookOpen, 
  User, 
  Info, 
  ShieldAlert, 
  MessageSquare, 
  Bot 
} from 'lucide-react';

const pageConfig: { [key: string]: { title: string, icon: React.ReactNode } } = {
  '/settings': { title: 'Settings', icon: <Settings className="h-5 w-5" /> },
  '/eaf': { title: 'Enrollment Assessment Form', icon: <FileText className="h-5 w-5" /> },
  '/grades': { title: 'Academic Reports', icon: <GraduationCap className="h-5 w-5" /> },
  '/accounts': { title: 'Student Accounts', icon: <WalletCards className="h-5 w-5" /> },
  '/offered-subjects': { title: 'Offered Subjects', icon: <BookOpen className="h-5 w-5" /> },
  '/profile': { title: 'Student Profile', icon: <User className="h-5 w-5" /> },
  '/about': { title: 'About LCC Hub', icon: <Info className="h-5 w-5" /> },
  '/disclaimer': { title: 'Legal & Privacy', icon: <ShieldAlert className="h-5 w-5" /> },
  '/community': { title: 'Community Feed', icon: <MessageSquare className="h-5 w-5" /> },
  '/assistant': { title: 'AI Assistant', icon: <Bot className="h-5 w-5" /> },
};

export default function PageHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isRestricted, setIsRestricted] = React.useState(false);

  React.useEffect(() => {
    const checkRestricted = () => {
      setIsRestricted(document.cookie.includes('is_restricted=1'));
    };
    checkRestricted();
    const interval = setInterval(checkRestricted, 500);
    return () => clearInterval(interval);
  }, []);

  // Get config for the current path, handling dynamic profile route
  const getConfig = () => {
    if (isRestricted) return null;
    if (pathname === '/') return null;
    if (pathname.startsWith('/profile/')) return pageConfig['/profile'];
    return pageConfig[pathname];
  };

  const config = getConfig();

  // Don't show header on home page or if pathname is not in config
  if (!config) {
    return null;
  }

  const { title, icon } = config;

  return (
    <div className="bg-white/80 border-b border-slate-200 sticky top-16 z-[90] backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="text-blue-600">
              {icon}
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
