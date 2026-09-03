'use client';

import { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onLogin: (id: string, pass: string) => void;
  loading: boolean;
  error?: string;
  requiresPasswordChange?: boolean;
  portalUrl?: string;
}

interface LoginFieldsProps {
  loading: boolean;
  error?: string;
  requiresPasswordChange?: boolean;
  portalUrl?: string;
  userId: string;
  password: string;
  agreedToTerms: boolean;
  showPassword: boolean;
  touched: { userId: boolean; password: boolean };
  submitted: boolean;
  userIdError: string;
  passwordError: string;
  errorSummaryRef: React.RefObject<HTMLDivElement | null>;
  setUserId: (v: string) => void;
  setPassword: (v: string) => void;
  setAgreedToTerms: (v: boolean) => void;
  setShowPassword: (v: boolean) => void;
  handleBlur: (field: 'userId' | 'password') => void;
  onSubmit: (e: React.FormEvent) => void;
}

function LoginFields({
  loading,
  error,
  requiresPasswordChange,
  portalUrl,
  userId,
  password,
  agreedToTerms,
  showPassword,
  touched,
  submitted,
  userIdError,
  passwordError,
  errorSummaryRef,
  setUserId,
  setPassword,
  setAgreedToTerms,
  setShowPassword,
  handleBlur,
  onSubmit,
}: LoginFieldsProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submitted && (userIdError || passwordError) && (
        <div
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby="error-summary-title"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
        >
          <h3 id="error-summary-title" className="text-xs font-bold">
            There is a problem
          </h3>
          <ul className="mt-1.5 space-y-1 text-xs">
            {userIdError && (
              <li>
                <a href="#userId" className="underline underline-offset-2 hover:text-destructive/80">
                  {userIdError}
                </a>
              </li>
            )}
            {passwordError && (
              <li>
                <a href="#password" className="underline underline-offset-2 hover:text-destructive/80">
                  {passwordError}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="userId">Student ID</Label>
        <Input
          id="userId"
          name="userId"
          type="text"
          required
          autoComplete="username"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={() => handleBlur('userId')}
          maxLength={20}
          placeholder="20241322"
          aria-invalid={Boolean(userIdError)}
          aria-describedby={userIdError ? 'userId-error' : undefined}
          className={cn('h-10', userIdError && 'border-destructive focus-visible:ring-destructive')}
        />
        {userIdError && (
          <p id="userId-error" className="text-xs text-destructive font-medium">
            {userIdError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            maxLength={64}
            placeholder="Your portal password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'password-error' : undefined}
            className={cn('h-10 pr-10', passwordError && 'border-destructive focus-visible:ring-destructive')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="text-xs text-destructive font-medium">
            {passwordError}
          </p>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          className="mt-0.5 cursor-pointer"
        />
        <Label
          htmlFor="terms"
          className="text-xs text-muted-foreground leading-snug font-normal cursor-pointer"
        >
          I agree to the <Link href="/disclaimer" className="underline underline-offset-4 hover:text-primary">Disclaimer</Link> and data policy.
        </Label>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20 text-destructive transition-all text-xs"
        >
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
          {requiresPasswordChange && portalUrl && (
            <Button asChild variant="destructive" size="sm" className="w-full h-8 text-xs">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                Change Password on Portal
              </a>
            </Button>
          )}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading || !agreedToTerms}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function LoginForm({ onLogin, loading, error, requiresPasswordChange, portalUrl }: LoginFormProps) {
  const isDesktop = useIsDesktop();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ userId: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const userIdError = (touched.userId || submitted) && !userId.trim() ? 'Enter your Student ID.' : '';
  const passwordError = (touched.password || submitted) && !password ? 'Enter your password.' : '';

  useEffect(() => {
    if (submitted && (userIdError || passwordError)) {
      errorSummaryRef.current?.focus();
    }
  }, [submitted, userIdError, passwordError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ userId: true, password: true });
    if (!agreedToTerms || !userId.trim() || !password) return;
    onLogin(userId, password);
  };

  const handleBlur = (field: 'userId' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldsProps = {
    loading,
    error,
    requiresPasswordChange,
    portalUrl,
    userId,
    password,
    agreedToTerms,
    showPassword,
    touched,
    submitted,
    userIdError,
    passwordError,
    errorSummaryRef,
    setUserId,
    setPassword,
    setAgreedToTerms,
    setShowPassword,
    handleBlur,
    onSubmit: handleSubmit,
  };

  return (
    <>
      {/* ---------- DESKTOP LAYOUT (md and up) ---------- */}
      {isDesktop && (
      <div className="relative w-full min-h-screen bg-background">
        <Image src="/login-building.jpg" alt="" fill priority className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/75" />

        {/* Brand header overlaid on the image */}
        <div className="relative z-10 flex items-center gap-3 p-6 md:p-8">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white/10 backdrop-blur backdrop-saturate-150 border border-white/10">
            <Image src="/logo.png" alt="LCC Hub Logo" fill className="object-contain" priority />
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold tracking-tight">LCCian Hub</h1>
            <p className="text-sm text-white/70 font-medium">Your Campus Life, Simplified.</p>
          </div>
        </div>

        {/* Login card overlaid on the image */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pb-10 pt-16">
          <div className="w-full max-w-sm">
            <Card className="relative w-full shadow-lg border-border bg-card/95 backdrop-blur">
              <CardHeader className="space-y-0.5 pb-2">
                <CardTitle className="text-lg">Sign in to LCC Hub</CardTitle>
                <CardDescription className="text-sm">
                  Enter your Student ID and password to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <LoginFields {...fieldsProps} />
                <div className="flex gap-2.5 p-2.5 bg-muted rounded-md border border-border mt-3">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    First login might take a minute while we securely sync your official school records.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
      {/* ---------- MOBILE LAYOUT (< md) ---------- */}
      {!isDesktop && (
      <div className="relative min-h-screen bg-background flex flex-col">
        <div className="relative shrink-0 h-48 w-full overflow-hidden border-b border-border">
          <Image src="/login-building.jpg" alt="" fill priority className="object-cover object-top" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
        </div>

        <div className="flex flex-1 items-center justify-center p-4 -mt-16 relative z-10">
          <div className="relative w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative h-12 w-12 mb-2">
                <Image src="/logo.png" alt="LCC Hub Logo" fill className="object-contain" priority />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                LCCian Hub
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Your Campus Life, Simplified.
              </p>
            </div>

            <Card className="relative w-full shadow-none border-border bg-card">
              <CardHeader className="space-y-1 flex flex-col items-center text-center">
                <CardTitle className="text-xl">Sign in to LCC Hub</CardTitle>
                <CardDescription>
                  Enter your Student ID and password to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <LoginFields {...fieldsProps} />
                <div className="flex gap-3 p-3 bg-muted rounded-md border border-border mt-4">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    First login might take a minute while we securely sync your official school records.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
