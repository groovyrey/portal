'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  WalletCards,
  FileText,
  MessageSquare,
  BrainCircuit,
  Settings,
  Info,
  Menu,
  X,
  Bell,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { cn } from '@/lib/utils';
import NotificationDrawer from './NotificationDrawer';
import Drawer from './Drawer';
import { useNotificationsQuery, useStudentQuery } from '@/lib/hooks';
import { Notification } from '@/types';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  const { data: currentUser } = useStudentQuery();
  const { data: notifications = [] } = useNotificationsQuery(isLoggedIn);
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const isStaff = currentUser?.badges?.includes('staff');

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const checkLogin = () => {
      const sessionActive = getCookie('portal_session_active') === '1';
      const data = localStorage.getItem('student_data');
      const effectiveLoggedIn = sessionActive || !!data;

      setIsLoggedIn(effectiveLoggedIn);
      if (data && effectiveLoggedIn) {
        try {
          const parsed = JSON.parse(data);
          setStudentId(parsed.id || null);
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        setStudentId(null);
      }
    };

    checkLogin();
    const interval = setInterval(checkLogin, 5000);
    window.addEventListener('storage', checkLogin);
    window.addEventListener('local-storage-update', checkLogin);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('local-storage-update', checkLogin);
    };
  }, []);

  const portalLinks: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
    { name: 'EAF', href: '/eaf', icon: FileText },
    { name: 'Community', href: '/community', icon: MessageSquare },
    { name: 'Assistant', href: '/assistant', icon: BrainCircuit },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const publicLinks: NavItem[] = [
    { name: 'About', href: '/about', icon: Info },
    { name: 'Disclaimer', href: '/disclaimer', icon: ShieldCheck },
  ];

  const navLinks: NavItem[] = isLoggedIn
    ? [
        ...portalLinks,
        ...(isStaff ? [{ name: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
      ]
    : publicLinks;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 active:scale-95 transition-all shrink-0">
              <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="LCCian Hub Logo" fill className="object-contain" priority />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">
                LCCian Hub
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              {isLoggedIn && (
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="relative h-9 w-9 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              {isLoggedIn && studentId && (
                <Link
                  href={`/student/${studentId}`}
                  className="hidden lg:flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Profile"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      {/* Mobile Menu (Drawer) */}
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Student Hub" side="right">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {isLoggedIn && studentId && (
            <div className="pt-3 mt-3 border-t border-border">
              <Link
                href={`/student/${studentId}`}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(`/student/${studentId}`)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <UserIcon className="h-4 w-4" />
                My Profile
              </Link>
            </div>
          )}
        </div>
      </Drawer>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16 w-full" />
    </>
  );
}
