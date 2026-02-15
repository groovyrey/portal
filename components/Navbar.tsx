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
  X 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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

  const publicLinks = [
    { name: 'Docs', href: '/docs', icon: FileText },
    { name: 'Disclaimer', href: '/disclaimer', icon: ShieldAlert },
  ];

  const authLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Offered Subjects', href: '/offered-subjects', icon: BookOpen },
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
  ];

  const navLinks = isLoggedIn ? [...authLinks, ...publicLinks] : publicLinks;

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
                <span className="font-bold text-xl tracking-tight text-slate-800">Student Portal</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      isActive(link.href)
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
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
        className={`fixed inset-0 z-[110] md:hidden transition-opacity duration-300 ${
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
          className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-50">
              <span className="font-black text-xs uppercase tracking-widest text-slate-400">Navigation</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                      isActive(link.href)
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Student Portal App v1.1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16 w-full"></div>
    </>
  );
}
