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
  CreditCard
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

  useEffect(() => {
    if (student?.settings?.notifications !== undefined) {
      setAppNotifsEnabled(student.settings.notifications);
    }
    if (student?.settings?.classReminders !== undefined) {
      setClassRemindersEnabled(student.settings.classReminders);
    }
    if (student?.settings?.paymentReminders !== undefined) {
      setPaymentRemindersEnabled(student.settings.paymentReminders);
    }
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
      case 'rating': return 'Rate LCC Hub';
      default: return '';
    }
  };

  const renderContent = () => {
    if (!student && type !== 'rating') return null;

    switch (type) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              <div className="relative flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-1 shadow-inner shrink-0 overflow-hidden">
                      <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student!.name)}&background=f8fafc&color=334155&size=256&bold=true`}
                          alt={student!.name}
                          className="w-full h-full rounded-xl object-cover group-hover:opacity-80 transition duration-500"
                      />
                  </div>
                  <div className="flex-1 min-w-0">
                      <h3 className="font-black text-xl text-slate-900 tracking-tight break-words">{student?.name || '?'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md border border-blue-100 uppercase tracking-tighter">Student ID</span>
                        <p className="text-xs text-slate-400 font-mono font-bold">{student?.id || '?'}</p>
                      </div>
                  </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DrawerInfoItem icon={<User className="text-blue-500" />} label="First Name" value={student!.parsedName?.firstName} />
                    <DrawerInfoItem icon={<User className="text-slate-400" />} label="Middle Name" value={student!.parsedName?.middleName} />
                    <DrawerInfoItem icon={<User className="text-blue-500" />} label="Last Name" value={student!.parsedName?.lastName} />
                </div>
                
                <div className="pt-6 border-t border-slate-100 space-y-4">
                    <DrawerInfoItem icon={<Mail className="text-rose-500" />} label="Email Address" value={student!.email} />
                    <DrawerInfoItem icon={<Phone className="text-emerald-500" />} label="Mobile Number" value={student!.mobile} />
                    <DrawerInfoItem icon={<MapPin className="text-amber-500" />} label="Home Address" value={student!.address} />
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <DrawerInfoItem icon={<GraduationCap className="text-indigo-500" />} label="Program" value={student!.course} />
                    <DrawerInfoItem icon={<Calendar className="text-blue-500" />} label="Year/Sem" value={`${student!.yearLevel} / ${student!.semester}`} />
                    <DrawerInfoItem icon={<Calendar className="text-slate-400" />} label="Enrolled On" value={student!.enrollment_date} />
                </div>
            </div>

            <div className="p-5 bg-slate-900 rounded-2xl text-white flex items-center gap-4 shadow-xl shadow-slate-200">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-400">Privacy Control</p>
                <p className="text-[11px] text-slate-300 font-medium mt-1 leading-relaxed">Your personal details are strictly private and only visible to you.</p>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-indigo-700 leading-tight">Keep your account safe by using a strong, unique password.</p>
            </div>
            <div>
              <SecuritySettings />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8 pb-8">
            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:opacity-80 transition duration-700 opacity-50"></div>
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 p-4 shadow-sm shrink-0 flex items-center justify-center relative z-10">
                <Bell className="h-full w-full text-blue-600" />
              </div>
              <div className="relative z-10">
                <h3 className="font-black text-lg text-slate-900 leading-tight tracking-tight">Alert Preferences</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">Manage how you receive real-time updates.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">General Updates</label>
                <div className="space-y-3">
                  <SettingsToggle 
                    icon={<Bell className="text-amber-500" />} 
                    title="App Notifications" 
                    description="Receive alerts for grades and activities"
                    enabled={appNotifsEnabled}
                    onToggle={handleAppNotifToggle}
                  />
                  <SettingsToggle 
                    icon={<Calendar className="text-blue-500" />} 
                    title="Daily Class Reminders" 
                    description="Get notified about your schedule every morning"
                    enabled={classRemindersEnabled}
                    onToggle={handleClassReminderToggle}
                  />
                  <SettingsToggle 
                    icon={<CreditCard className="text-emerald-500" />} 
                    title="Payment Reminders" 
                    description="Alerts for installments due in 5 days"
                    enabled={paymentRemindersEnabled}
                    onToggle={handlePaymentReminderToggle}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Privacy First</h4>
                <p className="text-[11px] text-emerald-700 font-bold mt-1 leading-relaxed">
                  We only send alerts for important school updates, grades, and community activity.
                </p>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
              <p className="text-xs font-bold text-blue-700 leading-relaxed">Manage what information is visible to other students in the community portal.</p>
            </div>
            <div className="space-y-4">
                <div>
                  <SettingsToggle 
                      icon={<Shield className="text-blue-500" />} 
                      title="Public Profile" 
                      description="Allow others to view your profile"
                      enabled={student?.settings?.isPublic ?? true}
                      onToggle={(val) => updateSettings!({ ...student?.settings, isPublic: val })}
                  />
                </div>
                <div>
                  <SettingsToggle 
                      icon={<GraduationCap className="text-purple-500" />} 
                      title="Show Academic Info" 
                      description="Show course and year level"
                      enabled={student?.settings?.showAcademicInfo ?? true}
                      onToggle={(val) => updateSettings!({ ...student?.settings, showAcademicInfo: val })}
                  />
                </div>
                <div>
                  <SettingsToggle 
                      icon={<IdCard className="text-amber-500" />} 
                      title="Show Student ID" 
                      description="Make your ID visible to others"
                      enabled={student?.settings?.showStudentId ?? false}
                      onToggle={(val) => updateSettings!({ ...student?.settings, showStudentId: val })}
                  />
                </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            <p className="text-sm font-bold text-slate-500 mb-6 text-center leading-relaxed">Your feedback is valuable to us. Let us know your experience using LCC Hub.</p>
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
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
    <div className="group flex items-start gap-4 p-2 -ml-2 rounded-2xl hover:bg-slate-50 transition-colors duration-300">
      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100 text-slate-400 shadow-sm group-hover:text-blue-600 group-hover:shadow-md transition-all duration-300">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">{label}</p>
        <p className="text-sm font-bold text-slate-800 break-words">{value || '?'}</p>
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
      className={`group w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
        isOn 
          ? 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50' 
          : 'bg-slate-50/30 border-slate-200 text-slate-400 opacity-80 hover:bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
          isOn ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400 group-hover:text-slate-600'
        }`}>
          {icon}
        </div>
        <div className="text-left">
          <p className={`text-sm font-black tracking-tight ${isOn ? 'text-slate-900' : 'text-slate-500'}`}>{title}</p>
          <p className={`text-[11px] font-bold mt-0.5 ${isOn ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${isOn ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
        <motion.div 
          animate={{ x: isOn ? 24 : 4 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </div>
    </button>
  );
}
