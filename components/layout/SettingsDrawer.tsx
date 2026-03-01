'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Lock, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  IdCard, 
  Star, 
  ShieldCheck, 
  Info,
  BellOff,
  ChevronRight,
  Sparkles,
  Loader2,
  CreditCard,
  History,
  ExternalLink,
  MessageSquare,
  Search
} from 'lucide-react';
import Drawer from './Drawer';
import SecuritySettings from '@/components/dashboard/SecuritySettings';
import StarRating from '@/components/ui/StarRating';
import { useStudent } from '@/lib/hooks';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsDrawerProps {
  type: string | null;
  isOpen: boolean;
  onClose: () => void;
  updateSettings?: (newSettings: any) => Promise<void>;
}

export default function SettingsDrawer({ type, isOpen, onClose, updateSettings }: SettingsDrawerProps) {
  const { student } = useStudent();
  const [appNotifsEnabled, setAppNotifsEnabled] = useState(true);
  const [classRemindersEnabled, setClassRemindersEnabled] = useState(true);
  const [paymentRemindersEnabled, setPaymentRemindersEnabled] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (type === 'activity' && isOpen) {
      setSearchQuery('');
      fetchLogs();
    }
  }, [type, isOpen]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/student/activity');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch activity logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (student?.settings?.notifications !== undefined) {
        setAppNotifsEnabled(student.settings.notifications);
      }
      if (student?.settings?.classReminders !== undefined) {
        setClassRemindersEnabled(student.settings.classReminders);
      }
      if (student?.settings?.paymentReminders !== undefined) {
        setPaymentRemindersEnabled(student.settings.paymentReminders);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [student]);

  const handleAppNotifToggle = async (enabled: boolean) => {
    if (!student || !updateSettings) return;
    setAppNotifsEnabled(enabled);
    await updateSettings({ ...student.settings, notifications: enabled });
  };

  const handleClassReminderToggle = async (enabled: boolean) => {
    if (!student || !updateSettings) return;
    setClassRemindersEnabled(enabled);
    await updateSettings({ ...student.settings, classReminders: enabled });
  };

  const handlePaymentReminderToggle = async (enabled: boolean) => {
    if (!student || !updateSettings) return;
    setPaymentRemindersEnabled(enabled);
    await updateSettings({ ...student.settings, paymentReminders: enabled });
  };

  const getTitle = () => {
    switch (type) {
      case 'profile': return 'Personal Information';
      case 'security': return 'Security Settings';
      case 'notifications': return 'Notification Settings';
      case 'privacy': return 'Privacy Settings';
      case 'activity': return 'Activity Log';
      case 'rating': return 'Rate LCC Hub';
      default: return '';
    }
  };

  const renderContent = () => {
    if (!student && type !== 'rating') return null;

    switch (type) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
                <div className="w-16 h-16 rounded-full bg-accent border border-border shrink-0 overflow-hidden">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student!.name)}&background=f8fafc&color=334155&size=256&bold=true`}
                        alt={student!.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground leading-tight truncate">{student?.name || '?'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-[9px] font-bold text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-900/50 uppercase">ID</span>
                      <p className="text-[11px] text-muted-foreground font-mono font-bold">{student?.id || '?'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <DrawerInfoItem icon={<User />} label="First" value={student!.parsedName?.firstName} />
                    <DrawerInfoItem icon={<User />} label="Middle" value={student!.parsedName?.middleName} />
                    <DrawerInfoItem icon={<User />} label="Last" value={student!.parsedName?.lastName} />
                </div>
                
                <div className="pt-5 border-t border-border space-y-3">
                    <DrawerInfoItem icon={<Mail />} label="Email" value={student!.email} />
                    <DrawerInfoItem icon={<Phone />} label="Mobile" value={student!.mobile} />
                    <DrawerInfoItem icon={<MapPin />} label="Address" value={student!.address} />
                </div>

                <div className="pt-5 border-t border-border grid grid-cols-2 gap-3">
                    <DrawerInfoItem icon={<GraduationCap />} label="Program" value={student!.course} />
                    <DrawerInfoItem icon={<Calendar />} label="Year/Sem" value={`${student!.yearLevel} / ${student!.semester}`} />
                </div>
            </div>

            <div className="p-4 bg-primary rounded-xl text-primary-foreground flex items-center gap-3 shadow-md shadow-primary/20">
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-[10px] text-primary-foreground/80 font-medium leading-relaxed">Personal records are strictly private and only visible to you.</p>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-xl border border-border mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-[11px] font-medium text-muted-foreground">Update your credentials to maintain account security.</p>
            </div>
            <SecuritySettings />
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-12 -mt-12 group-hover:opacity-80 transition duration-700 opacity-50"></div>
              <div className="w-12 h-12 rounded-xl bg-accent border border-border shrink-0 flex items-center justify-center relative z-10">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-base text-foreground leading-tight">Preferences</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Manage how you receive updates.</p>
              </div>
            </div>

            <div className="space-y-3">
              <SettingsToggle 
                icon={<Bell className="text-muted-foreground" />} 
                title="Alerts" 
                description="Grades and activities"
                enabled={appNotifsEnabled}
                onToggle={handleAppNotifToggle}
              />
              <SettingsToggle 
                icon={<Calendar className="text-muted-foreground" />} 
                title="Schedule" 
                description="Daily morning reminders"
                enabled={classRemindersEnabled}
                onToggle={handleClassReminderToggle}
              />
              <SettingsToggle 
                icon={<CreditCard className="text-muted-foreground" />} 
                title="Financials" 
                description="Payment due reminders"
                enabled={paymentRemindersEnabled}
                onToggle={handlePaymentReminderToggle}
              />
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
              <div className="p-2 bg-card rounded-lg shadow-sm shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                We only send alerts for important school updates, grades, and community activity.
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-accent rounded-xl border border-border mb-2">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">Manage your visibility in the student community.</p>
            </div>
            <div className="space-y-3">
                <SettingsToggle 
                    icon={<Shield size={16} className="text-muted-foreground" />} 
                    title="Public Profile" 
                    description="Visible to other students"
                    enabled={student?.settings?.isPublic ?? true}
                    onToggle={(val) => updateSettings!({ ...student?.settings, isPublic: val })}
                />
                <SettingsToggle 
                    icon={<GraduationCap size={16} className="text-muted-foreground" />} 
                    title="Academic Info" 
                    description="Course and year level"
                    enabled={student?.settings?.showAcademicInfo ?? true}
                    onToggle={(val) => updateSettings!({ ...student?.settings, showAcademicInfo: val })}
                />
                <SettingsToggle 
                    icon={<IdCard size={16} className="text-muted-foreground" />} 
                    title="Student ID" 
                    description="Visible on your profile"
                    enabled={student?.settings?.showStudentId ?? false}
                    onToggle={(val) => updateSettings!({ ...student?.settings, showStudentId: val })}
                />
            </div>
          </div>
        );

      case 'activity':
        const filteredLogs = logs.filter(log => 
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-none">Activity History</h3>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">Last 15 actions performed</p>
                </div>
              </div>

              {/* Modern Search Bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className={`h-3.5 w-3.5 transition-colors ${searchQuery ? 'text-foreground' : 'text-muted-foreground'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Filter actions (e.g. 'Login', 'AI')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-accent border border-border focus:bg-card focus:border-muted-foreground rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium transition-all outline-none text-foreground"

                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Updating...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mb-3 border border-border">
                    <History className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Recent Activity</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mb-3 border border-border">
                    <Search className="h-5 w-5 text-muted-foreground/20" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No matches found</p>
                  <button onClick={() => setSearchQuery('')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 hover:underline">Clear search</button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log) => {
                      const date = new Date(log.createdAt);
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      // Categorical Icons
                      let Icon = History;
                      let iconBg = "bg-accent";
                      let iconColor = "text-muted-foreground";

                      const action = log.action.toLowerCase();
                      if (action.includes('login')) { Icon = Lock; iconBg = "bg-blue-50 dark:bg-blue-950/30"; iconColor = "text-blue-500"; }
                      else if (action.includes('security') || action.includes('password')) { Icon = Shield; iconBg = "bg-amber-50 dark:bg-amber-950/30"; iconColor = "text-amber-500"; }
                      else if (action.includes('settings')) { Icon = Info; iconBg = "bg-purple-50"; iconColor = "text-purple-500"; }
                      else if (action.includes('ai') || action.includes('assistant')) { Icon = Sparkles; iconBg = "bg-indigo-50"; iconColor = "text-indigo-500"; }
                      else if (action.includes('community') || action.includes('post') || action.includes('comment')) { Icon = MessageSquare; iconBg = "bg-emerald-50 dark:bg-emerald-950/30"; iconColor = "text-emerald-500"; }
                      else if (action.includes('system') || action.includes('diagnostic')) { Icon = ShieldCheck; iconBg = "bg-slate-900"; iconColor = "text-white"; }

                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={log.id} 
                          className="group flex gap-3 p-3 bg-card hover:bg-accent rounded-xl border border-border transition-all active:scale-[0.99]"
                        >
                          <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-white shadow-sm`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[11px] font-bold text-foreground truncate uppercase tracking-tight">{log.action}</h4>
                              <span className={`text-[9px] font-bold shrink-0 uppercase ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/50'}`}>
                                {isToday ? 'Today' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium leading-snug line-clamp-1">{log.details}</p>
                          </div>

                          {log.link && (
                            <div className="flex items-center pl-1">
                               <a href={log.link} className="p-1.5 rounded-md hover:bg-card hover:shadow-sm text-muted-foreground/50 hover:text-foreground transition-all">
                                  <ChevronRight className="h-3.5 w-3.5" />
                               </a>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <div className="p-3 bg-accent rounded-xl border border-border text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {searchQuery ? `End of search results` : 'End of History'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            <p className="text-xs font-medium text-muted-foreground text-center leading-relaxed">How is your experience with LCC Hub?</p>
            <div className="bg-accent p-6 rounded-2xl border border-border">
              <StarRating onSuccess={() => setTimeout(onClose, 2000)} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={getTitle()}>
      {isOpen && renderContent()}
    </Drawer>
  );
}

function DrawerInfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="flex items-start gap-3 p-2">
      <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0 border border-border text-muted-foreground">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 14 }) : icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-bold text-foreground truncate">{value || '?'}</p>
      </div>
    </div>
  );
}

function SettingsToggle({ icon, title, description, enabled, onToggle }: { icon: React.ReactNode, title: string, description: string, enabled: boolean, onToggle?: (val: boolean) => void }) {
  const [isOn, setIsOn] = useState(enabled);

  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  const handleToggle = () => {
    const nextVal = !isOn;
    if (onToggle) {
      onToggle(nextVal);
    } else {
      setIsOn(nextVal);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className={`group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
        isOn 
          ? 'bg-card border-muted-foreground shadow-sm' 
          : 'bg-accent border-border text-muted-foreground hover:bg-card hover:border-muted-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${
          isOn ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'
        }`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-foreground">{title}</p>
          <p className="text-[10px] font-medium text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors shadow-inner ${isOn ? 'bg-primary' : 'bg-muted'}`}>
        <motion.div 
          animate={{ x: isOn ? 22 : 2 }}
          className="absolute top-1 w-3 h-3 bg-card rounded-full shadow-sm"
        />
      </div>
    </button>
  );
}
