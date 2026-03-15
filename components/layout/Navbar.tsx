'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Users,
  ChevronDown,
  Building2,
  Settings,
  Info,
  BrainCircuit,
  DatabaseZap,
  RefreshCw,
  Bell,
  LayoutGrid,
  ShieldCheck,
  Mic,
  Monitor
} from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { APP_VERSION } from '@/lib/version';
import NotificationDrawer from './NotificationDrawer';
import { useNotificationsQuery, useStudentQuery } from '@/lib/hooks';
import { Notification } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPortalExpanded, setIsPortalExpanded] = useState(true);
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(true);
  const [isSocialExpanded, setIsSocialExpanded] = useState(true);
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: currentUser } = useStudentQuery();
  const { data: notifications = [] } = useNotificationsQuery(isLoggedIn);
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const isStaff = currentUser?.badges?.includes('staff');

  useEffect(() => {
    // Helper to get cookie value
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Check if logged in to show navbar
    const checkLogin = () => {
      const sessionActive = getCookie('portal_session_active') === '1';
      const data = localStorage.getItem('student_data');
      
      // If session cookie is gone, we are logged out regardless of localStorage
      if (!sessionActive) {
        if (data) {
          localStorage.removeItem('student_data');
          window.dispatchEvent(new Event('local-storage-update'));
        }
        setIsLoggedIn(false);
        setStudentId(null);
        setStudentName(null);
        setLastSynced(null);
        return;
      }

      setIsLoggedIn(!!data);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setStudentId(parsed.id);
          const firstName = parsed.parsedName?.firstName || parsed.name.split(',')[0];
          setStudentName(firstName);
          
          if (parsed.updated_at) {
            try {
              // Handle multiple possible date formats (Firebase Timestamp, ISO string, etc.)
              let date: Date;
              if (typeof parsed.updated_at === 'object' && parsed.updated_at.seconds) {
                date = new Date(parsed.updated_at.seconds * 1000);
              } else {
                date = new Date(parsed.updated_at);
              }

              if (!isNaN(date.getTime())) {
                setLastSynced(date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
              } else {
                setLastSynced('Just now');
              }
            } catch (e) {
              setLastSynced('Just now');
            }
          }
        } catch (e) {
          setIsLoggedIn(false);
        }
      } else {
        setStudentId(null);
        setStudentName(null);
        setLastSynced(null);
      }
    };
    
    checkLogin();
    // Also check on a timer as backup for cookie expiration
    const interval = setInterval(checkLogin, 5000);
    // Also listen for storage changes (to handle login/logout)
    window.addEventListener('storage', checkLogin);
    // Custom event for same-tab login/logout
    window.addEventListener('local-storage-update', checkLogin);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('local-storage-update', checkLogin);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const syncToast = toast.loading('Syncing your academic records...');
    
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Trigger auto-sync from cookie
      });
      
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        
        // Update frontend state immediately
        await queryClient.invalidateQueries({ queryKey: ['student-data'] });
        router.refresh();
        
        toast.success('Synchronization complete!', { id: syncToast });
      } else {
        toast.error(result.error || 'Sync failed.', { id: syncToast });
      }
    } catch (err) {
      toast.error('Network error during sync.', { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMoreOpen(false);
      setIsPortalOpen(false);
      setIsWorkspaceOpen(false);
      setIsSocialOpen(false);
      setIsAdminOpen(false);
    };
    if (isMoreOpen || isPortalOpen || isWorkspaceOpen || isSocialOpen || isAdminOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isMoreOpen, isPortalOpen, isWorkspaceOpen, isSocialOpen, isAdminOpen]);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const publicLinks = [
    { name: 'About', href: '/about', icon: Info },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Disclaimer', href: '/disclaimer', icon: ShieldAlert },
  ];

  const portalLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Grades', href: '/grades', icon: GraduationCap },
    { name: 'Accounts', href: '/accounts', icon: WalletCards },
    { name: 'EAF', href: '/eaf', icon: FileText },
  ];

  const workspaceLinks = [
    { name: 'Cici', href: '/assistant', icon: BrainCircuit, desc: 'AI Study Buddy' },
    { name: 'Meetings', href: '/meetings', icon: Mic, desc: 'Archive' },
  ];

  const socialLinks = [
    { name: 'Profile', href: studentId ? `/student/${studentId}` : '/student', icon: UserIcon },
    { name: 'Community', href: '/community', icon: MessageSquare },
  ];

  const adminLinks = [
    { name: 'Panel', href: '/admin', icon: ShieldCheck },
  ];

  const authLinks = [
    { name: 'Portal', icon: LayoutDashboard, children: portalLinks },
    { name: 'Workspace', icon: Monitor, children: workspaceLinks },
    { name: 'Social', icon: Users, children: socialLinks },
    ...(isStaff ? [{ name: 'Admin', icon: ShieldCheck, children: adminLinks }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'About', href: '/about', icon: Info },
  ];

  // For desktop view: show a few primary links and the rest in "More"
  const desktopPrimary = isLoggedIn ? [
    { name: 'Portal', icon: LayoutDashboard, children: portalLinks },
    { name: 'Workspace', icon: DatabaseZap, children: workspaceLinks },
    { name: 'Social', icon: Users, children: socialLinks },
    ...(isStaff ? [{ name: 'Admin', icon: ShieldCheck, children: adminLinks }] : []),
  ] : [];

  const desktopMore = isLoggedIn ? [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'About', href: '/about', icon: Info },
  ] : [];

  const navLinks = isLoggedIn ? authLinks : [];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="bg-background/80 border-b border-border fixed top-0 left-0 right-0 z-[100] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 active:scale-95 transition-all">
                <div className="bg-primary rounded-lg p-1.5 text-primary-foreground">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-foreground">LCC Hub</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-[9px] font-bold text-muted-foreground border border-border uppercase tracking-wider">Beta</span>
                </div>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {(isLoggedIn ? desktopPrimary : publicLinks).map((link: any) => {
                const Icon = link.icon;
                
                if (link.children) {
                  const isDropdownOpen = link.name === 'Portal' ? isPortalOpen : link.name === 'Workspace' ? isWorkspaceOpen : link.name === 'Social' ? isSocialOpen : isAdminOpen;
                  
                  return (
                    <div key={link.name} className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (link.name === 'Portal') {
                            setIsPortalOpen(!isPortalOpen);
                            setIsWorkspaceOpen(false);
                            setIsSocialOpen(false);
                            setIsAdminOpen(false);
                          } else if (link.name === 'Workspace') {
                            setIsWorkspaceOpen(!isWorkspaceOpen);
                            setIsPortalOpen(false);
                            setIsSocialOpen(false);
                            setIsAdminOpen(false);
                          } else if (link.name === 'Social') {
                            setIsSocialOpen(!isSocialOpen);
                            setIsPortalOpen(false);
                            setIsWorkspaceOpen(false);
                            setIsAdminOpen(false);
                          } else if (link.name === 'Admin') {
                            setIsAdminOpen(!isAdminOpen);
                            setIsPortalOpen(false);
                            setIsWorkspaceOpen(false);
                            setIsSocialOpen(false);
                          }
                          setIsMoreOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all group ${
                          isDropdownOpen || link.children.some((child: any) => isActive(child.href))
                            ? 'bg-primary/5 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? 'scale-110' : ''}`} />
                        {link.name}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute left-0 mt-3 w-56 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl py-2 z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-1.5 space-y-0.5">
                            {link.children.map((child: any) => {
                              const ChildIcon = child.icon;
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group/item ${
                                    isActive(child.href)
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                  }`}
                                >
                                  <ChildIcon className={`h-4 w-4 transition-colors ${isActive(child.href) ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'}`} />
                                  {child.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? 'bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}

              <div className="flex items-center gap-1 ml-2">
                <ThemeToggle />
                
                {isLoggedIn && (
                  <>
                    <button
                      onClick={() => setIsNotifOpen(true)}
                      className={`relative p-2.5 rounded-full transition-all duration-200 ${
                        isNotifOpen 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                          : 'bg-background text-muted-foreground hover:bg-accent/80 hover:text-foreground border border-border/60'
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background shadow-sm">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoreOpen(!isMoreOpen);
                          setIsPortalOpen(false);
                          setIsSocialOpen(false);
                          setIsAdminOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                          isMoreOpen || desktopMore.some(link => isActive(link.href))
                            ? 'bg-primary/5 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        More
                        <ChevronDown className={`h-4 w-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isMoreOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-1.5 space-y-0.5">
                            {desktopMore.map((link) => {
                              const Icon = link.icon;
                              return (
                                <Link
                                  key={link.name}
                                  href={link.href}
                                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive(link.href)
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                  }`}
                                >
                                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                  {link.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-1">
              <ThemeToggle />
              {isLoggedIn && (
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="relative p-2 rounded-xl border border-border bg-background text-muted-foreground active:bg-accent transition-all shadow-sm"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Drawer */}
      <NotificationDrawer 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
      />

      {/* Mobile Menu (Drawer) */}
      <div 
        className={`fixed inset-0 z-[110] lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-foreground/40 dark:bg-card/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
        
        {/* Drawer */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-72 bg-background shadow-2xl border-l border-border transition-transform duration-300 transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-[10px] uppercase tracking-tight text-muted-foreground">Student Console</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {isLoggedIn && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-base font-bold text-foreground leading-tight">
                      {studentName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-primary animate-pulse' : 'bg-primary'}`}></div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {lastSynced || 'Just now'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSync();
                    }}
                    disabled={isSyncing}
                    className={`p-2 rounded-xl border transition-all ${
                      isSyncing 
                        ? 'bg-accent border-border text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary border-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20'
                    }`}
                    title="Manual Sync"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              {(isLoggedIn ? navLinks : publicLinks).map((link: any) => {
                const Icon = link.icon;
                
                if (link.children) {
                  const isExpanded = link.name === 'Portal' ? isPortalExpanded : link.name === 'Workspace' ? isWorkspaceExpanded : link.name === 'Social' ? isSocialExpanded : isAdminExpanded;
                  const setIsExpanded = link.name === 'Portal' ? setIsPortalExpanded : link.name === 'Workspace' ? setIsWorkspaceExpanded : link.name === 'Social' ? setIsSocialExpanded : setIsAdminExpanded;
                  
                  return (
                    <div key={link.name} className="space-y-1 py-1">
                      <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-accent group-active:bg-primary/10">
                            <Icon className="h-5 w-5" />
                          </div>
                          {link.name}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="space-y-1 px-2 pb-2">
                          {link.children.map((child: any) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                                  isActive(child.href)
                                    ? 'text-primary bg-primary/5'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                }`}
                              >
                                <ChildIcon className={`h-5 w-5 transition-all ${isActive(child.href) ? 'text-primary' : 'text-muted-foreground/40'}`} />
                                <span className="text-sm font-medium">{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      isActive(link.href)
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="p-6 border-t border-border text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Version {APP_VERSION}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16 w-full"></div>
    </>
  );
}
