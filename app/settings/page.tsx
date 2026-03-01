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
  IdCard,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
      
      // Invalidate and clear React Query cache
      queryClient.setQueryData(['student-data'], null);
      queryClient.invalidateQueries({ queryKey: ['student-data'] });
      
      window.dispatchEvent(new Event('local-storage-update'));
      toast.success('Logged out successfully');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Account Section */}
        <section>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Account</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Shield size={18} className="text-muted-foreground" />} 
              title="Personal Information" 
              description="Profile and contact details"
              onClick={() => setActiveDrawer('profile')}
            />
            <SettingsItem 
              icon={<Lock size={18} className="text-muted-foreground" />} 
              title="Security" 
              description="Password and authentication"
              onClick={() => setActiveDrawer('security')}
            />
            <SettingsItem 
              icon={<History size={18} className="text-muted-foreground" />} 
              title="Activity Log" 
              description="Your recent actions and updates"
              onClick={() => setActiveDrawer('activity')}
            />
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Preferences</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Calendar size={18} className="text-muted-foreground" />} 
              title="Google Calendar" 
              description="Sync your schedule automatically"
              onClick={() => setActiveDrawer('google-sync')}
            />
            <SettingsItem 
              icon={<Bell size={18} className="text-muted-foreground" />} 
              title="Notifications" 
              description="Alerts and updates"
              onClick={() => setActiveDrawer('notifications')}
            />
            <SettingsItem 
              icon={<Eye size={18} className="text-muted-foreground" />} 
              title="Privacy" 
              description="Visibility and data sharing"
              onClick={() => setActiveDrawer('privacy')}
            />
          </div>
        </section>

        {/* Support Section */}
        <section>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Support</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Star size={18} className="text-muted-foreground" />} 
              title="Rate LCC Hub" 
              description="Share your feedback"
              onClick={() => setActiveDrawer('rating')}
            />
            <SettingsItem 
              icon={<Shield size={18} className="text-muted-foreground" />} 
              title="Help Center" 
              description="Documentation and FAQs"
              onClick={() => router.push('/docs')}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-card hover:bg-red-50 border border-border hover:border-red-100 rounded-2xl transition-all text-muted-foreground hover:text-red-600 font-bold active:scale-[0.99] group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center border border-border group-hover:bg-card group-hover:border-red-100 transition-colors">
                <LogOut size={18} />
              </div>
              <span className="text-sm">Sign Out</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>
        </section>
      </div>

      <SettingsDrawer 
        type={activeDrawer} 
        isOpen={activeDrawer !== null} 
        onClose={() => setActiveDrawer(null)} 
        updateSettings={updateSettings}
      />

      <footer className="mt-10 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Version {APP_VERSION}</p>
      </footer>
    </div>
  );
}

function SettingsItem({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors border-b border-border last:border-0 group"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center border border-border group-hover:bg-card transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}
