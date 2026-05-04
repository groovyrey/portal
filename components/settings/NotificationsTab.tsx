'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  ShieldCheck 
} from 'lucide-react';
import { Student } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Notifications</h4>
        <p className="text-sm text-muted-foreground">
          Manage how you receive updates and reminders.
        </p>
      </div>

      <div className="grid gap-6">
        <SettingsItem 
          title="App Alerts" 
          description="Updates about grades and school activities"
          enabled={appNotifsEnabled}
          onToggle={handleAppNotifToggle}
        />
        <Separator />
        <SettingsItem 
          title="Schedule Reminders" 
          description="Daily summary of your classes"
          enabled={classRemindersEnabled}
          onToggle={handleClassReminderToggle}
        />
        <Separator />
        <SettingsItem 
          title="Payment Alerts" 
          description="Reminders for upcoming due dates"
          enabled={paymentRemindersEnabled}
          onToggle={handlePaymentReminderToggle}
        />
      </div>

      <div className="rounded-md border bg-muted/50 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          We only send important notifications related to your academics.
        </p>
      </div>
    </div>
  );
}

function SettingsItem({ title, description, enabled, onToggle }: { title: string, description: string, enabled: boolean, onToggle: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-semibold">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
      />
    </div>
  );
}
