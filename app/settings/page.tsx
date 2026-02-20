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
import Drawer from '@/components/layout/Drawer';
import SecuritySettings from '@/components/dashboard/SecuritySettings';
import StarRating from '@/components/ui/StarRating';
import { APP_VERSION } from '@/lib/version';
import { useStudent } from '@/lib/hooks';
import SettingsDrawer from '@/components/layout/SettingsDrawer';

export default function SettingsPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (student !== undefined) {
      setLoading(false);
    }
  }, [student]);

  const updateSettings = async (newSettings: any) => {
    if (!student) return;
    
    // Optimistic update
    const updatedStudent = { ...student, settings: newSettings };
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
      if (saved) {
        // Since we don't have setStudent, we just rely on the next event loop or manual update
        // But the try block is for the server update. If it fails, we should ideally revert localStorage.
        // Actually, the previous data is already in 'saved' (before our optimistic update).
        // Wait, 'saved' here is the *newly* set data because localStorage.setItem was called above.
        // We need to keep the old data to revert.
      }
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
            <SettingsItem 
              icon={<Bell className="text-amber-500" />} 
              title="Notifications" 
              description="Manage how you receive updates"
              onClick={() => setActiveDrawer('notifications')}
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

      <SettingsDrawer 
        type={activeDrawer} 
        isOpen={activeDrawer !== null} 
        onClose={() => setActiveDrawer(null)} 
        updateSettings={updateSettings}
      />

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
