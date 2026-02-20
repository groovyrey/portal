'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, KeyRound, CheckCircle2, Loader2, Bell, BellOff, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePushNotifications } from '@/lib/hooks';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("Password is too short.");
      setError("Password is too short.");
      return;
    }

    setLoading(true);
    const updateToast = toast.loading('Updating password...');

    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success('Password updated successfully!', { id: updateToast });
        
        localStorage.removeItem('student_data');
        window.dispatchEvent(new Event('local-storage-update'));

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
            router.push('/');
        }, 2000);
      } else {
        const msg = data.error || 'Failed to update password.';
        setError(msg);
        toast.error(msg, { id: updateToast });
      }
    } catch (err) {
      setError('A network error occurred.');
      toast.error('Network error.', { id: updateToast });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Success!</h2>
        <p className="text-slate-500 text-sm font-medium">
          Your password has been updated. You will be redirected to login.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Current Password</label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Enter current password"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Min 4 characters"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Confirm Password</label>
        <div className="relative">
          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Repeat new password"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      <div className="pt-6 mt-6 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Web Push Notifications</label>
        
        {!isSupported ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <Info className="h-4 w-4 flex-shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">Your browser does not support push notifications.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-slate-500 font-medium px-1">
              Receive real-time alerts even when your browser is closed.
            </p>
            
            <button
              type="button"
              onClick={isSubscribed ? unsubscribe : subscribe}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isSubscribed 
                  ? 'bg-blue-50/50 border-blue-200 text-blue-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">
                    {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
                  </p>
                  <p className="text-[10px] opacity-70 font-medium">
                    {isSubscribed ? 'You are receiving push alerts' : 'Click to enable browser alerts'}
                  </p>
                </div>
              </div>
              
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isSubscribed ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSubscribed ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Password'
        )}
      </button>
    </form>
  );
}
