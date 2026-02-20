'use client';

import React from 'react';
import { Bell, BellOff, Info, Settings, ShieldCheck, X } from 'lucide-react';
import { usePushNotifications } from '@/lib/hooks';

interface PushNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PushNotificationDrawer({ isOpen, onClose }: PushNotificationDrawerProps) {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 z-[150] transition-opacity duration-300"
      />
      
      {/* Drawer Panel */}
      <div
        className={`fixed bg-white shadow-2xl z-[160] flex flex-col transition-transform duration-300 inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl translate-y-0`}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Notification Settings</h2>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Web Push & Alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-8 pb-8">
            
            {/* Main Toggle Section */}
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
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isSubscribed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-tight">
                        {isSubscribed ? 'Notifications Active' : 'Notifications Off'}
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Settings className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">System Level Control</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                    You can also manage these settings in your browser's site permissions.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
