'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  WalletCards, 
  FileText, 
  ShieldAlert, 
  Menu, 
  X,
  Lock,
  MessageSquare,
  User as UserIcon,
  ChevronDown,
  Building2,
  Settings,
  Info,
  BrainCircuit
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if logged in to show navbar
    const checkLogin = () => {
      const data = localStorage.getItem('student_data');
      setIsLoggedIn(!!data);
    };
    
    checkLogin();
    // Also listen for storage changes (to handle login/logout)
    window.addEventListener('storage', checkLogin);
    // Custom event for same-tab login/logout
    window.addEventListener('local-storage-update', checkLogin);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('local-storage-update', checkLogin);
    };
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMoreOpen(false);
    if (isMoreOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isMoreOpen]);

  const publicLinks = [
    { name: 'About', href: '/about', icon: Info },
    { name: 'Disclaimer', href: '/disclaimer', icon: ShieldAlert },
  ];

  const authLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Assistant', href: '/assistant', icon: BrainCircuit },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
    { name: 'Subjects', href: '/offered-subjects', icon: BookOpen },
    { name: 'Community', href: '/community', icon: MessageSquare },
    { name: 'EAF', href: '/eaf', icon: FileText },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'About', href: '/about', icon: Info },
  ];

  // For desktop view: show a few primary links and the rest in "More"
  const desktopPrimary = isLoggedIn ? [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Assistant', href: '/assistant', icon: BrainCircuit },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Community', href: '/community', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ] : [];

  const desktopMore = isLoggedIn ? [
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
    { name: 'Subjects', href: '/offered-subjects', icon: BookOpen },
    { name: 'EAF', href: '/eaf', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'About', href: '/about', icon: Info },
  ] : [];

  const navLinks = isLoggedIn ? authLinks : [];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="bg-white/80 border-b border-slate-200 fixed top-0 left-0 right-0 z-[100] backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-blue-600 rounded-lg p-1.5 text-white shadow-lg shadow-blue-200">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">LCC Hub</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {(isLoggedIn ? desktopPrimary : publicLinks).map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}

              {isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreOpen(!isMoreOpen);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isMoreOpen || desktopMore.some(link => isActive(link.href))
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    More
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[110] animate-in fade-in zoom-in duration-200">
                      {desktopMore.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                              isActive(link.href)
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {link.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu (Drawer) */}
      <div 
        className={`fixed inset-0 z-[110] lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
        
        {/* Drawer */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl transition-transform duration-300 transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Navigation</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              {(isLoggedIn ? navLinks : publicLinks).map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 text-center">
              <p className="text-[10px] font-medium text-slate-400">LCC Hub v1.1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16 w-full"></div>
    </>
  );
}
