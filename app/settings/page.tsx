'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/types';
import { 
  Lock, 
  Bell, 
  Eye, 
  Shield, 
  ArrowLeft,
  ChevronRight,
  LogOut,
  Loader2,
  Mail,
  Calendar,
  GraduationCap,
  User,
  Star,
  MapPin,
  Phone,
  IdCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Drawer from '@/components/Drawer';
import SecuritySettings from '@/components/SecuritySettings';
import StarRating from '@/components/StarRating';
import { APP_VERSION } from '@/lib/version';

export default function SettingsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('student_data');
    if (saved) {
      setStudent(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const updateSettings = async (newSettings: any) => {
    if (!student) return;
    
    // Optimistic update
    const updatedStudent = { ...student, settings: newSettings };
    setStudent(updatedStudent);
    localStorage.setItem('student_data', JSON.stringify(updatedStudent));
    window.dispatchEvent(new Event('local-storage-update'));

    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Settings updated');
    } catch (e) {
      toast.error('Failed to save settings');
      // Revert on failure
      const saved = localStorage.getItem('student_data');
      if (saved) setStudent(JSON.parse(saved));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/student/logout', { method: 'POST' });
      localStorage.removeItem('student_data');
      window.dispatchEvent(new Event('local-storage-update'));
      toast.success('Logged out successfully');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="space-y-8">
        {/* Account Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Account</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Shield className="text-blue-500" />} 
              title="Personal Information" 
              description="View your profile details"
              onClick={() => setActiveDrawer('profile')}
            />
            <SettingsItem 
              icon={<Lock className="text-purple-500" />} 
              title="Security & Password" 
              description="Change your password and secure your account"
              onClick={() => setActiveDrawer('security')}
            />
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Preferences</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <SettingsToggle 
              icon={<Bell className="text-amber-500" />} 
              title="Notifications" 
              description="Manage how you receive updates"
              enabled={student?.settings?.notifications ?? true}
              onToggle={(val) => updateSettings({ ...student?.settings, notifications: val })}
            />
            <SettingsItem 
              icon={<Eye className="text-emerald-500" />} 
              title="Privacy" 
              description="Control what information others can see"
              onClick={() => setActiveDrawer('privacy')}
            />
          </div>
        </section>

        {/* Feedback Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Feedback</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Star className="text-amber-500" />} 
              title="Rate LCC Hub" 
              description="Help us improve with your rating"
              onClick={() => setActiveDrawer('rating')}
            />
          </div>
        </section>

        {/* Support Section */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Support</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Shield className="text-slate-500" />} 
              title="Help & Support" 
              description="FAQs and contact support"
              onClick={() => router.push('/docs')}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl transition-colors text-red-600 font-semibold group"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-red-100">
                <LogOut className="h-5 w-5" />
              </div>
              <span>Sign Out of Account</span>
            </div>
            <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </section>
      </div>

      {/* Drawers */}
      <Drawer 
        isOpen={activeDrawer === 'security'} 
        onClose={() => setActiveDrawer(null)} 
        title="Security Settings"
      >
        <div className="space-y-6">
            <p className="text-sm text-slate-500 mb-6">Update your portal password to keep your account secure.</p>
            <SecuritySettings />
        </div>
      </Drawer>

      <Drawer 
        isOpen={activeDrawer === 'rating'} 
        onClose={() => setActiveDrawer(null)} 
        title="Rate LCC Hub"
      >
        <div className="space-y-6">
            <p className="text-sm text-slate-500 mb-6 text-center">Your feedback is valuable to us. Let us know your experience using LCC Hub.</p>
            <StarRating onSuccess={() => setTimeout(() => setActiveDrawer(null), 2000)} />
        </div>
      </Drawer>

      <Drawer 
        isOpen={activeDrawer === 'profile'} 
        onClose={() => setActiveDrawer(null)} 
        title="Personal Information"
      >
        {student && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 shadow-sm shrink-0">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f8fafc&color=334155&size=256&bold=true`}
                        alt={student.name}
                        className="w-full h-full rounded-lg object-cover"
                    />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{student.id}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DrawerInfoItem icon={<User className="text-blue-500" />} label="First Name" value={student.parsedName?.firstName} />
                    <DrawerInfoItem icon={<User className="text-slate-400" />} label="Middle Name" value={student.parsedName?.middleName} />
                    <DrawerInfoItem icon={<User className="text-blue-500" />} label="Last Name" value={student.parsedName?.lastName} />
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <DrawerInfoItem icon={<Mail />} label="Email Address" value={student.email} />
                    <DrawerInfoItem icon={<Phone />} label="Mobile Number" value={student.mobile} />
                    <DrawerInfoItem icon={<MapPin />} label="Home Address" value={student.address} />
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <DrawerInfoItem icon={<GraduationCap />} label="Program" value={student.course} />
                    <DrawerInfoItem icon={<Calendar />} label="Year/Sem" value={`${student.yearLevel} / ${student.semester}`} />
                    <DrawerInfoItem icon={<Calendar />} label="Enrolled On" value={student.enrollment_date} />
                </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 rounded-xl">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Privacy Control</p>
                <p className="text-[10px] text-slate-400">Your personal contact details and address are strictly private and only visible to you in this settings panel.</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        isOpen={activeDrawer === 'privacy'}
        onClose={() => setActiveDrawer(null)}
        title="Privacy Settings"
      >
        <div className="space-y-6">
            <p className="text-sm text-slate-500">Manage what information is visible to other students in the community portal.</p>
            <div className="space-y-4">
                <SettingsToggle 
                    icon={<Shield className="text-blue-500" />} 
                    title="Public Profile" 
                    description="Allow others to view your profile"
                    enabled={student?.settings?.isPublic ?? true}
                    onToggle={(val) => updateSettings({ ...student?.settings, isPublic: val })}
                />
                <SettingsToggle 
                    icon={<GraduationCap className="text-purple-500" />} 
                    title="Show Academic Info" 
                    description="Show course and year level"
                    enabled={student?.settings?.showAcademicInfo ?? true}
                    onToggle={(val) => updateSettings({ ...student?.settings, showAcademicInfo: val })}
                />
                <SettingsToggle 
                    icon={<IdCard className="text-amber-500" />} 
                    title="Show Student ID" 
                    description="Make your ID visible to others"
                    enabled={student?.settings?.showStudentId ?? false}
                    onToggle={(val) => updateSettings({ ...student?.settings, showStudentId: val })}
                />
            </div>
        </div>
      </Drawer>

      <footer className="mt-12 text-center">
        <p className="text-xs font-medium text-slate-400">LCC Hub v{APP_VERSION}</p>
      </footer>
    </div>
  );
}

function SettingsItem({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </button>
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
    <div className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
          {icon}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button 
        onClick={handleToggle}
        className={`w-10 h-6 rounded-full p-1 transition-colors ${isOn ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function DrawerInfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
    return (
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-slate-700">{value || 'Not Specified'}</p>
        </div>
      </div>
    );
}
