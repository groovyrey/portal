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
  '/settings': { title: 'Settings', icon: <Settings className="h-4 w-4" /> },
  '/eaf': { title: 'Registration Form', icon: <FileText className="h-4 w-4" /> },
  '/grades': { title: 'Registry', icon: <GraduationCap className="h-4 w-4" /> },
  '/accounts': { title: 'Ledger', icon: <WalletCards className="h-4 w-4" /> },
  '/subjects': { title: 'Catalog', icon: <BookOpen className="h-4 w-4" /> },
  '/profile': { title: 'Profile', icon: <User className="h-4 w-4" /> },
  '/about': { title: 'LCC Hub', icon: <Info className="h-4 w-4" /> },
  '/disclaimer': { title: 'Privacy', icon: <ShieldAlert className="h-4 w-4" /> },
  '/community': { title: 'Community', icon: <MessageSquare className="h-4 w-4" /> },
  '/assistant': { title: 'Assistant', icon: <Bot className="h-4 w-4" /> },
};

interface PageHeaderProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ title: propsTitle, description, icon: propsIcon, children }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRestricted, setIsRestricted] = React.useState(false);

  React.useEffect(() => {
    const checkRestricted = () => {
      setIsRestricted(document.cookie.includes('is_restricted=1'));
    };
    checkRestricted();
    const interval = setInterval(checkRestricted, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get config for the current path, handling dynamic profile route
  const getConfig = () => {
    if (isRestricted) return null;
    if (pathname === '/') return null;
    if (pathname.startsWith('/profile/')) return pageConfig['/profile'];
    return pageConfig[pathname] || null;
  };

  const config = getConfig();

  // If title is passed as prop, use it. Otherwise, use config title.
  const title = propsTitle || config?.title;
  const icon = propsIcon || config?.icon;

  // Don't show header if no title/icon found and not provided as props
  if (!title && !icon) {
    return null;
  }

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-[90] backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-900 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-slate-900">
              {icon}
            </div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
