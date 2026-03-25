'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  GraduationCap, 
  IdCard,
  Eye,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Student } from '@/types';

interface PrivacyTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function PrivacyTab({ student, updateSettings }: PrivacyTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent border border-border shrink-0 flex items-center justify-center shadow-sm">
          <Eye className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground leading-tight">Privacy Settings</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Control who can see your profile and academic data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsToggle 
            icon={<Shield />} 
            title="Public Profile" 
            description="Allow other students to find you"
            enabled={student?.settings?.isPublic ?? true}
            onToggle={(val) => updateSettings({ ...student?.settings, isPublic: val })}
        />
        <SettingsToggle 
            icon={<GraduationCap />} 
            title="Academic Info" 
            description="Show your course and year level"
            enabled={student?.settings?.showAcademicInfo ?? true}
            onToggle={(val) => updateSettings({ ...student?.settings, showAcademicInfo: val })}
        />
        <SettingsToggle 
            icon={<IdCard />} 
            title="Student ID" 
            description="Display your unique identifier"
            enabled={student?.settings?.showStudentId ?? false}
            onToggle={(val) => updateSettings({ ...student?.settings, showStudentId: val })}
        />
      </div>

      <div className="p-4 bg-accent/50 rounded-xl border border-border flex items-center gap-3">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <p className="text-[11px] font-medium text-muted-foreground italic">
          Note: Instructors and administrators can always view your academic information.
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
