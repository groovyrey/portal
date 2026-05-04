'use client';

import React from 'react';
import { 
  Shield, 
  GraduationCap, 
  IdCard,
  Lock
} from 'lucide-react';
import { Student } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PrivacyTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function PrivacyTab({ student, updateSettings }: PrivacyTabProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Privacy</h4>
        <p className="text-sm text-muted-foreground">
          Control what others can see on your profile.
        </p>
      </div>

      <div className="grid gap-6">
        <SettingsItem 
          title="Public Profile" 
          description="Allow other students to find you in the community"
          enabled={student?.settings?.isPublic ?? true}
          onToggle={(val) => updateSettings({ ...student?.settings, isPublic: val })}
        />
        <Separator />
        <SettingsItem 
          title="Academic Info" 
          description="Show your course and year level on your profile"
          enabled={student?.settings?.showAcademicInfo ?? true}
          onToggle={(val) => updateSettings({ ...student?.settings, showAcademicInfo: val })}
        />
        <Separator />
        <SettingsItem 
          title="Show ID Number" 
          description="Display your unique identifier to others"
          enabled={student?.settings?.showStudentId ?? false}
          onToggle={(val) => updateSettings({ ...student?.settings, showStudentId: val })}
        />
      </div>

      <div className="rounded-md border bg-muted/50 p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Faculty and staff can always view your official records.
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
