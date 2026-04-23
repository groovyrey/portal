import { useState } from 'react';
import { LayoutDashboard, User, Lock, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LoginFormProps {
  onLogin: (id: string, pass: string) => void;
  loading: boolean;
  error?: string;
  requiresPasswordChange?: boolean;
  portalUrl?: string;
}

export default function LoginForm({ onLogin, loading, error, requiresPasswordChange, portalUrl }: LoginFormProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    onLogin(userId, password);
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-sm w-full max-w-sm overflow-hidden">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="relative h-12 w-12">
              <Image 
                src="/logo.png" 
                alt="LCCian Hub Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">LCCian Hub</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium italic">Student-Made Academic Workspace</p>
        </div>
        
        <div className="p-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Student ID</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  maxLength={20}
                  className="block w-full px-4 py-2.5 border border-border rounded-xl bg-muted placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium text-foreground"
                  placeholder="ID Number"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Portal Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={64}
                  className="block w-full pl-4 pr-10 py-2.5 border border-border rounded-xl bg-muted placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium text-foreground"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 px-1">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-0 cursor-pointer bg-muted"
              />
              <label htmlFor="terms" className="text-[10px] text-muted-foreground leading-normal font-medium cursor-pointer">
                I agree to the <Link href="/disclaimer" className="text-foreground font-bold hover:underline">Notice of Disclaimer</Link> and data synchronization policy.
              </label>
            </div>

            {error && (
              <div className="flex flex-col gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive transition-all">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">{error}</p>
                </div>
                {requiresPasswordChange && portalUrl && (
                  <a 
                    href={portalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center justify-center gap-1.5 py-1.5 bg-destructive/20 hover:bg-destructive/30 border border-destructive/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    Change Password on Portal
                    <LayoutDashboard className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"></div>
                  Syncing
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-primary/80 font-bold leading-normal uppercase tracking-tight">
                First login may take up to 60 seconds while we securely synchronize your official academic records.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
