'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Shield,
  Save,
  Building
} from 'lucide-react';
import { Student } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ProfileTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function ProfileTab({ student, updateSettings }: ProfileTabProps) {
  const [selectedCampus, setSelectedCampus] = useState(student.settings?.campus || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({
      ...(student.settings || {}),
      campus: selectedCampus
    });
    setIsSaving(false);
  };

  const hasChanges = selectedCampus !== (student.settings?.campus || '');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20 border">
          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0f172a&color=f8fafc&size=256`} />
          <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">{student.name}</h3>
          <p className="text-sm text-muted-foreground font-mono">ID: {student.id}</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-8">
        <section className="space-y-4">
          <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Personal Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoItem icon={<User className="h-4 w-4" />} label="First Name" value={student.parsedName?.firstName} />
            <InfoItem icon={<User className="h-4 w-4" />} label="Middle Name" value={student.parsedName?.middleName} />
            <InfoItem icon={<User className="h-4 w-4" />} label="Last Name" value={student.parsedName?.lastName} />
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
            <InfoItem icon={<Phone className="h-4 w-4" />} label="Mobile" value={student.mobile} />
            <div className="md:col-span-2">
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={student.address} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Academic</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Program" value={student.course} />
            <InfoItem icon={<Calendar className="h-4 w-4" />} label="Level / Semester" value={`${student.yearLevel} / ${student.semester}`} />
          </div>
        </section>

        <section className="space-y-4 pt-2">
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="campus">Current Campus</Label>
              <select 
                id="campus"
                value={selectedCampus} 
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select a campus</option>
                <option value="Muzon Campus">Muzon Campus</option>
                <option value="Francisco Homes Campus">Francisco Homes Campus</option>
                <option value="Main Campus (CBAS)">Main Campus (CBAS)</option>
              </select>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </section>
      </div>

      <div className="rounded-md border bg-muted/50 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your personal info is private and only visible to you.
        </p>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <p className="text-sm font-medium">{value || 'None'}</p>
      </div>
    </div>
  );
}
