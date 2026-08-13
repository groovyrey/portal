'use client';

import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Shield,
  Camera,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Student } from '@/types';
import StudentAvatar from '@/components/shared/StudentAvatar';
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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 4 * 1024 * 1024;

export default function ProfileTab({ student, updateSettings }: ProfileTabProps) {
  const [selectedCampus, setSelectedCampus] = useState(student.settings?.campus || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({
      ...(student.settings || {}),
      campus: selectedCampus
    });
    setIsSaving(false);
  };

  const hasChanges = selectedCampus !== (student.settings?.campus || '');

  const updateLocalStudent = (updates: Partial<Student>) => {
    const raw = localStorage.getItem('student_data');
    const current = raw ? JSON.parse(raw) : student;
    localStorage.setItem('student_data', JSON.stringify({ ...current, ...updates }));
    window.dispatchEvent(new Event('local-storage-update'));
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      const saveRes = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl: data.url }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error || 'Failed to save photo');

      updateLocalStudent({ profilePhotoUrl: data.url });
      setPreviewUrl(null);
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be 4MB or smaller');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    uploadPhoto(file);
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl: null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to remove photo');

      updateLocalStudent({ profilePhotoUrl: null });
      setPreviewUrl(null);
      toast.success('Profile photo removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <StudentAvatar
            name={student.name}
            photoUrl={previewUrl || student.profilePhotoUrl}
            className="h-16 w-16 border"
            fallbackClassName="bg-primary/10 text-primary text-xl font-bold"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold tracking-tight truncate">{student.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">ID: {student.id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Change Photo
            </Button>
            {(previewUrl || student.profilePhotoUrl) && (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={handleRemovePhoto}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

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
        <p className="text-sm font-semibold">{value || 'None'}</p>
      </div>
    </div>
  );
}
