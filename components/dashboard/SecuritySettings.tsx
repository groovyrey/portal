'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle, KeyRound, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Very Weak', color: 'bg-slate-200' });
  const router = useRouter();

  useEffect(() => {
    calculateStrength(newPassword);
  }, [newPassword]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) {
      setStrength({ score: 0, label: 'None', color: 'bg-slate-200' });
      return;
    }

    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const results = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Medium', color: 'bg-amber-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Very Strong', color: 'bg-blue-600' }
    ];

    setStrength({ score, ...results[score] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      setError("New passwords do not match.");
      return;
    }

    if (strength.score < 2) {
      toast.error("Password is too weak. Please use a stronger password.");
      setError("Password strength must be at least Medium.");
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
            placeholder="Min 8 characters recommended"
          />
        </div>

        {/* Password Strength Indicator */}
        <div className="mt-2 px-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strength</span>
            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${strength.color.replace('bg-', 'text-')}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-1 w-full flex gap-1.5 mt-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-full transition-all duration-500 ${
                  i < strength.score 
                    ? strength.color 
                    : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
            Use 8+ characters with mixed case, numbers, and symbols for best security.
          </p>
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
