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
  ExternalLink
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

  useEffect(() => {
    if (type === 'activity' && isOpen) {
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
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student!.name)}&background=f8fafc&color=334155&size=256&bold=true`}
                        alt={student!.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">{student?.name || '?'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-[9px] font-bold text-blue-600 rounded border border-blue-100 uppercase">ID</span>
                      <p className="text-[11px] text-slate-400 font-mono font-bold">{student?.id || '?'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <DrawerInfoItem icon={<User />} label="First" value={student!.parsedName?.firstName} />
                    <DrawerInfoItem icon={<User />} label="Middle" value={student!.parsedName?.middleName} />
                    <DrawerInfoItem icon={<User />} label="Last" value={student!.parsedName?.lastName} />
                </div>
                
                <div className="pt-5 border-t border-slate-100 space-y-3">
                    <DrawerInfoItem icon={<Mail />} label="Email" value={student!.email} />
                    <DrawerInfoItem icon={<Phone />} label="Mobile" value={student!.mobile} />
                    <DrawerInfoItem icon={<MapPin />} label="Address" value={student!.address} />
                </div>

                <div className="pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <DrawerInfoItem icon={<GraduationCap />} label="Program" value={student!.course} />
                    <DrawerInfoItem icon={<Calendar />} label="Year/Sem" value={`${student!.yearLevel} / ${student!.semester}`} />
                </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center gap-3 shadow-md shadow-slate-200">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">Personal records are strictly private and only visible to you.</p>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
              <Info className="h-4 w-4 text-slate-400" />
              <p className="text-[11px] font-medium text-slate-600">Update your credentials to maintain account security.</p>
            </div>
            <SecuritySettings />
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:opacity-80 transition duration-700 opacity-50"></div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center relative z-10">
                <Bell className="h-6 w-6 text-slate-400" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-base text-slate-900 leading-tight">Preferences</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manage how you receive updates.</p>
              </div>
            </div>

            <div className="space-y-3">
              <SettingsToggle 
                icon={<Bell className="text-slate-400" />} 
                title="Alerts" 
                description="Grades and activities"
                enabled={appNotifsEnabled}
                onToggle={handleAppNotifToggle}
              />
              <SettingsToggle 
                icon={<Calendar className="text-slate-400" />} 
                title="Schedule" 
                description="Daily morning reminders"
                enabled={classRemindersEnabled}
                onToggle={handleClassReminderToggle}
              />
              <SettingsToggle 
                icon={<CreditCard className="text-slate-400" />} 
                title="Financials" 
                description="Payment due reminders"
                enabled={paymentRemindersEnabled}
                onToggle={handlePaymentReminderToggle}
              />
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0 border border-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                We only send alerts for important school updates, grades, and community activity.
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">Manage your visibility in the student community.</p>
            </div>
            <div className="space-y-3">
                <SettingsToggle 
                    icon={<Shield size={16} className="text-slate-400" />} 
                    title="Public Profile" 
                    description="Visible to other students"
                    enabled={student?.settings?.isPublic ?? true}
                    onToggle={(val) => updateSettings!({ ...student?.settings, isPublic: val })}
                />
                <SettingsToggle 
                    icon={<GraduationCap size={16} className="text-slate-400" />} 
                    title="Academic Info" 
                    description="Course and year level"
                    enabled={student?.settings?.showAcademicInfo ?? true}
                    onToggle={(val) => updateSettings!({ ...student?.settings, showAcademicInfo: val })}
                />
                <SettingsToggle 
                    icon={<IdCard size={16} className="text-slate-400" />} 
                    title="Student ID" 
                    description="Visible on your profile"
                    enabled={student?.settings?.showStudentId ?? false}
                    onToggle={(val) => updateSettings!({ ...student?.settings, showStudentId: val })}
                />
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
              <History className="h-4 w-4 text-blue-500" />
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Recent Activity</p>
            </div>

            <div className="space-y-4">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Retrieving Logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <History className="h-6 w-6 text-slate-200" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No activities found</p>
                </div>
              ) : (
                <div className="relative space-y-4">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />
                  {logs.map((log, idx) => (
                    <div key={log.id} className="relative pl-10 group">
                      <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-slate-200 border-2 border-white ring-4 ring-white group-hover:bg-blue-400 transition-colors" />
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all group-hover:shadow-md active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-3">{log.details}</p>
                        
                        {log.link && (
                          <a 
                            href={log.link}
                            className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                          >
                            View Details
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            <p className="text-xs font-medium text-slate-500 text-center leading-relaxed">How is your experience with LCC Hub?</p>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
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
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 14 }) : icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-bold text-slate-700 truncate">{value || '?'}</p>
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
          ? 'bg-white border-slate-300 shadow-sm' 
          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${
          isOn ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'
        }`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900">{title}</p>
          <p className="text-[10px] font-medium text-slate-400">{description}</p>
        </div>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors shadow-inner ${isOn ? 'bg-slate-900' : 'bg-slate-200'}`}>
        <motion.div 
          animate={{ x: isOn ? 22 : 2 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
        />
      </div>
    </button>
  );
}
