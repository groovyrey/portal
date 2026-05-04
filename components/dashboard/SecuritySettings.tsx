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
  Copy,
  Terminal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  const [success, setSuccess] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Very Weak', variant: 'destructive' as any });

  useEffect(() => {
    calculateStrength(newPassword);
  }, [newPassword]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) {
      setStrength({ score: 0, label: 'None', variant: 'outline' });
      return;
    }

    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (!hasSpecial && pass.length >= 6) score++;

    const results = [
      { label: 'Very Weak', variant: 'destructive' },
      { label: 'Weak', variant: 'destructive' },
      { label: 'Medium', variant: 'outline' },
      { label: 'Strong', variant: 'default' },
      { label: 'Very Strong', variant: 'default' }
    ];

    setStrength({ score, ...results[score] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setDebugHtml(null);

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      setError("Passwords don't match.");
      return;
    }

    if (/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Special characters not allowed.");
      setError("Please use only letters and numbers.");
      return;
    }

    if (strength.score < 2) {
      toast.error("Password is too weak.");
      setError("Please choose a stronger password.");
      return;
    }

    setLoading(true);
    const updateToast = toast.loading('Updating...');

    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success('Password updated!', { id: updateToast });
        
        queryClient.setQueryData(['student-data'], null);
        queryClient.invalidateQueries({ queryKey: ['student-data'] });
        localStorage.removeItem('student_data');
        window.dispatchEvent(new Event('local-storage-update'));

        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
      } else {
        const msg = data.error || 'Failed to update.';
        setError(msg);
        if (data._debug_html) setDebugHtml(data._debug_html);
        toast.error(msg, { id: updateToast });
      }
    } catch (err) {
      setError('Network error.');
      toast.error('Network error.', { id: updateToast });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Success!</h3>
          <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="pr-10"
            placeholder="Enter old password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
              placeholder="Min 8 characters recommended"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Strength</Label>
            <Badge variant={strength.variant} className="text-[9px] h-4">
              {strength.label}
            </Badge>
          </div>
          <div className="h-1.5 w-full flex gap-1 bg-muted rounded-full overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full flex-1 transition-all",
                  i < strength.score ? "bg-primary" : "bg-transparent"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2 text-[10px] text-muted-foreground leading-relaxed">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            <p>
              Use 8+ characters. <span className="font-bold text-destructive">Special characters (@, #, !) are not allowed by the portal.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
            placeholder="Repeat new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Password'
        )}
      </Button>

      {debugHtml && (
        <div className="pt-6 space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Debug Info</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(debugHtml);
                toast.success('Copied');
              }}
              className="h-7 text-[10px]"
            >
              <Copy className="mr-1.5 h-3 w-3" />
              Copy Output
            </Button>
          </div>
          <textarea
            readOnly
            value={debugHtml}
            className="w-full h-32 bg-muted text-[10px] font-mono p-3 rounded-md border resize-none focus:outline-none"
          />
        </div>
      )}
    </form>
  );
}
