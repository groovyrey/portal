'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Info, Settings, ShieldCheck, MessageSquare } from 'lucide-react';
import { usePushNotifications, useStudent } from '@/lib/hooks';
import Drawer from './Drawer';
import { toast } from 'sonner';

interface PushNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PushNotificationDrawer({ isOpen, onClose }: PushNotificationDrawerProps) {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const { student } = useStudent();
  const [appNotifsEnabled, setAppNotifsEnabled] = useState(true);

  useEffect(() => {
    if (student?.settings?.notifications !== undefined) {
      setAppNotifsEnabled(student.settings.notifications);
    }
  }, [student]);

  const updateAppSettings = async (enabled: boolean) => {
    if (!student) return;
    
    setAppNotifsEnabled(enabled);
    
    // Optimistic update
    const updatedStudent = { 
      ...student, 
      settings: { ...student.settings, notifications: enabled } 
    };
    localStorage.setItem('student_data', JSON.stringify(updatedStudent));
    window.dispatchEvent(new Event('local-storage-update'));

    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedStudent.settings }),
      });
      
      if (!res.ok) throw new Error('Failed to update settings');
    } catch (e) {
      toast.error('Failed to save notification preference');
      // Revert on failure
      setAppNotifsEnabled(!enabled);
      const oldStudent = { ...student };
      localStorage.setItem('student_data', JSON.stringify(oldStudent));
      window.dispatchEvent(new Event('local-storage-update'));
    }
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Notification Settings"
      side="bottom"
    >
      <div className="space-y-8 pb-8">
        {/* Header Info */}
        <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">Alert Preferences</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Manage how you receive real-time updates.</p>
          </div>
        </div>

        {/* 1. App Notifications Toggle */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block">General Updates</label>
          <button
            onClick={() => updateAppSettings(!appNotifsEnabled)}
            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
              appNotifsEnabled 
                ? 'bg-slate-50/50 border-slate-200 text-slate-900' 
                : 'bg-slate-50/30 border-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${appNotifsEnabled ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">App Notifications</p>
                <p className="text-xs opacity-70 font-medium mt-1">Receive alerts for grades and activities</p>
              </div>
            </div>
            
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${appNotifsEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${appNotifsEnabled ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </div>

        {/* 2. Web Push Notifications Toggle */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block">Browser Notifications</label>
          
          {!isSupported ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Not Supported</p>
                <p className="text-xs opacity-80 font-medium">Your current browser doesn't support push notifications.</p>
              </div>
            </div>
          ) : (
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                isSubscribed 
                  ? 'bg-blue-50/50 border-blue-200 text-blue-700 ring-4 ring-blue-50/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${isSubscribed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {isSubscribed ? 'Web Push Active' : 'Web Push Off'}
                  </p>
                  <p className="text-xs opacity-70 font-medium mt-1">
                    {isSubscribed ? 'You will receive real-time alerts' : 'Tap to enable browser alerts'}
                  </p>
                </div>
              </div>
              
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${isSubscribed ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${isSubscribed ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Privacy First</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                We only send alerts for important school updates, grades, and community activity.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] mt-4"
        >
          Done
        </button>
      </div>
    </Drawer>
  );
}
