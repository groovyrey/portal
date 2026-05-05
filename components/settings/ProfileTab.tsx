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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border">
          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0f172a&color=f8fafc&size=256`} />
          <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight">{student.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">ID: {student.id}</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6">
        <section className="space-y-3">
          <h4 className="text-[11px] font-bold tracking-tight uppercase text-muted-foreground">Personal Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoItem icon={<User className="h-3.5 w-3.5" />} label="First Name" value={student.parsedName?.firstName} />
            <InfoItem icon={<User className="h-3.5 w-3.5" />} label="Middle Name" value={student.parsedName?.middleName} />
            <InfoItem icon={<User className="h-3.5 w-3.5" />} label="Last Name" value={student.parsedName?.lastName} />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[11px] font-bold tracking-tight uppercase text-muted-foreground">Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={student.email} />
            <InfoItem icon={<Phone className="h-3.5 w-3.5" />} label="Mobile" value={student.mobile} />
            <div className="md:col-span-2">
              <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={student.address} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[11px] font-bold tracking-tight uppercase text-muted-foreground">Academic</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={<GraduationCap className="h-3.5 w-3.5" />} label="Program" value={student.course} />
            <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Level / Semester" value={`${student.yearLevel} / ${student.semester}`} />
          </div>
        </section>

        <section className="space-y-3 pt-1">
          <div className="grid gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="campus" className="text-xs">Current Campus</Label>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger id="campus" className="w-full">
                  <SelectValue placeholder="Select a campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Muzon Campus">Muzon Campus</SelectItem>
                  <SelectItem value="Francisco Homes Campus">Francisco Homes Campus</SelectItem>
                  <SelectItem value="Main Campus (CBAS)">Main Campus (CBAS)</SelectItem>
                </SelectContent>
              </Select>
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
    <div className="space-y-0.5">
      <Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">{label}</Label>
      <div className="flex items-center gap-1.5">
        <div className="text-muted-foreground/70">{icon}</div>
        <p className="text-sm font-semibold truncate">{value || 'None'}</p>
      </div>
    </div>
  );
}
