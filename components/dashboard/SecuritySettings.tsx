'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Loader2, 
  Info, 
  Eye, 
  EyeOff,
  Code,
  Copy,
  ChevronDown,
  Terminal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugHtml, setDebugHtml] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
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
    
    // Note: Special characters are NOT allowed by the school portal
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (!hasSpecial && pass.length >= 6) score++;

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
    setDebugHtml(null);

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      setError("New passwords do not match.");
      return;
    }

    if (/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Special characters are not allowed by the school portal.");
      setError("Please use only letters and numbers (no @, #, !, etc.).");
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
        
        // Immediately clear cache and local storage
        queryClient.setQueryData(['student-data'], null);
        queryClient.invalidateQueries({ queryKey: ['student-data'] });
        queryClient.invalidateQueries({ queryKey: ['student'] });
        
        localStorage.removeItem('student_data');
        window.dispatchEvent(new Event('local-storage-update'));

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
      } else {
        const msg = data.error || 'Failed to update password.';
        setError(msg);
        if (data._debug_html) {
          setDebugHtml(data._debug_html);
        }
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
            type={showCurrentPassword ? "text" : "password"}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type={showNewPassword ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Min 8 characters recommended"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
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
            Use 8+ characters with mixed case and numbers. <span className="text-red-500 font-bold">Special characters (@, #, !, etc.) are NOT allowed.</span>
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Confirm Password</label>
        <div className="relative">
          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            placeholder="Repeat new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
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

      {/* Diagnostic Area */}
      <AnimatePresence>
        {debugHtml && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Terminal className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic Data</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(debugHtml);
                  toast.success('Diagnostic data copied to clipboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <Copy className="h-3 w-3" />
                Copy HTML
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium mb-3 leading-relaxed">
              The school portal returned the following response. Copy this data and share it with support if the issue persists.
            </p>
            
            <div className="relative group">
              <textarea
                readOnly
                value={debugHtml}
                className="w-full h-48 bg-slate-900 text-slate-300 text-[10px] font-mono p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none custom-scrollbar"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none rounded-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
