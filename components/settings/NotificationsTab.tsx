'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Student } from '@/types';

interface NotificationsTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function NotificationsTab({ student, updateSettings }: NotificationsTabProps) {
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
    setAppNotifsEnabled(enabled);
    await updateSettings({ ...student.settings, notifications: enabled });
  };

  const handleClassReminderToggle = async (enabled: boolean) => {
    setClassRemindersEnabled(enabled);
    await updateSettings({ ...student.settings, classReminders: enabled });
  };

  const handlePaymentReminderToggle = async (enabled: boolean) => {
    setPaymentRemindersEnabled(enabled);
    await updateSettings({ ...student.settings, paymentReminders: enabled });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition duration-700 opacity-50"></div>
        <div className="w-14 h-14 rounded-2xl bg-accent border border-border shrink-0 flex items-center justify-center relative z-10 shadow-sm">
          <Bell className="h-7 w-7 text-primary" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-lg text-foreground leading-tight">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Manage how and when you receive updates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsToggle 
          icon={<Bell />} 
          title="App Alerts" 
          description="Grades and academic activities"
          enabled={appNotifsEnabled}
          onToggle={handleAppNotifToggle}
        />
        <SettingsToggle 
          icon={<Calendar />} 
          title="Schedule Reminders" 
          description="Daily morning schedule summary"
          enabled={classRemindersEnabled}
          onToggle={handleClassReminderToggle}
        />
        <SettingsToggle 
          icon={<CreditCard />} 
          title="Financial Alerts" 
          description="Payment due date reminders"
          enabled={paymentRemindersEnabled}
          onToggle={handlePaymentReminderToggle}
        />
      </div>

      <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-start gap-4">
        <div className="p-2.5 bg-card rounded-xl shadow-sm shrink-0 border border-emerald-500/20">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
          Privacy is our priority. We only send critical alerts related to your academic progress and important campus announcements.
        </p>
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
          ? 'bg-card border-primary/50 shadow-sm'
          : 'bg-accent/50 border-border text-muted-foreground hover:bg-card hover:border-border'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all shadow-sm ${
          isOn ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'
        }`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground leading-none mb-1">{title}</p>
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">{description}</p>
        </div>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition-colors shadow-inner shrink-0 ${isOn ? 'bg-primary' : 'bg-muted'}`}>
        <div
          style={{ transform: `translateX(${isOn ? 22 : 3}px)` }}
          className={`absolute top-1.5 w-3 h-3 rounded-full shadow-sm transition-colors ${
            isOn ? 'bg-primary-foreground' : 'bg-white'
          }`}
        />
      </div>
    </button>
  );
}
