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

export default function LoginForm({ onLogin, loading, error, requiresPasswordChange, portalUrl }: LoginFormProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ userId: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const userIdError = (touched.userId || submitted) && !userId.trim() ? 'Enter your Student ID.' : '';
  const passwordError = (touched.password || submitted) && !password ? 'Enter your password.' : '';
  const hasValidationError = Boolean(userIdError || passwordError);

  useEffect(() => {
    if (submitted && hasValidationError) {
      errorSummaryRef.current?.focus();
    }
  }, [submitted, hasValidationError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ userId: true, password: true });
    if (!agreedToTerms || !userId.trim() || !password) return;
    onLogin(userId, password);
  };

  const handleBlur = (field: 'userId' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="relative min-h-screen bg-primary flex flex-col overflow-hidden">
      <div className="relative shrink-0">
      {/* Photo band at the top */}
      <div aria-hidden className="relative z-0 w-full max-h-[45vh] aspect-[1080/644] overflow-hidden shrink-0 mx-auto">
        <Image src="/login-building.jpg" alt="" fill priority className="object-cover object-top" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-card via-card/10 to-transparent" />
      </div>
      {/* Wave transition at the bottom of the image, in front of it */}
      <div aria-hidden className="relative z-10 -mt-13 h-[56px] w-full overflow-hidden shrink-0">
        <svg className="wave-drift-tile" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-back" width="420" height="56" patternUnits="userSpaceOnUse">
              <g transform="scale(0.875)">
                <path d="M0 32 C60 -8 180 -8 240 32 S420 72 480 32 V64 H0 Z" fill="#1d4ed8" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-back)" />
        </svg>
        <svg className="wave-drift-tile wave-drift-tile--mid" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-mid" width="420" height="56" patternUnits="userSpaceOnUse">
              <g transform="scale(0.875)">
                <path d="M0 38 C60 4 180 4 240 38 S420 72 480 38 V64 H0 Z" fill="#2f6ff0" opacity="0.8" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-mid)" />
        </svg>
        <svg className="wave-drift-tile wave-drift-tile--slow text-primary" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-front" width="420" height="56" patternUnits="userSpaceOnUse">
              <g transform="scale(0.875)">
                <path d="M0 44 C60 16 180 16 240 44 S420 72 480 44 V64 H0 Z" fill="currentColor" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-front)" />
        </svg>
      </div>
      {/* Swimming fish — lower, in the blue section below the waves */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-8 h-28 z-20">
        <div className="fish-swimmer bottom-[8px]" style={{ animationDuration: '14s', animationDelay: '-5s' }}>
          <div className="fish-bob">
            <svg width="28" height="17" viewBox="0 0 30 18">
              <path d="M1 9 C4 3 8 3 11 9 C8 15 4 15 1 9 Z" fill="#b45309" />
              <ellipse cx="16" cy="9" rx="9" ry="6" fill="#f59e0b" />
              <path d="M16 3 C18.5 3.2 20.5 4.5 21 7 L16 6.8 Z" fill="#ea580c" />
              <circle cx="20" cy="7.2" r="1.4" fill="#ffffff" />
              <circle cx="20.6" cy="7" r="0.7" fill="#0f172a" />
            </svg>
          </div>
        </div>
        <div className="fish-swimmer fish-swimmer--reverse bottom-[0px]" style={{ animationDuration: '19s', animationDelay: '-11s' }}>
          <div className="fish-bob -scale-x-100" style={{ animationDelay: '-1.6s' }}>
            <svg width="24" height="15" viewBox="0 0 30 18">
              <path d="M1 9 C4 3 8 3 11 9 C8 15 4 15 1 9 Z" fill="#e11d48" />
              <ellipse cx="16" cy="9" rx="9" ry="6" fill="#fda4af" />
              <path d="M16 3 C18.5 3.2 20.5 4.5 21 7 L16 6.8 Z" fill="#f43f5e" />
              <circle cx="20" cy="7.2" r="1.4" fill="#ffffff" />
              <circle cx="20.6" cy="7" r="0.7" fill="#0f172a" />
            </svg>
          </div>
        </div>
        <div className="fish-swimmer bottom-[-8px]" style={{ animationDuration: '24s', animationDelay: '-18s' }}>
          <div className="fish-bob" style={{ animationDuration: '4s' }}>
            <svg width="20" height="12" viewBox="0 0 30 18">
              <path d="M1 9 C4 3 8 3 11 9 C8 15 4 15 1 9 Z" fill="#4d7c0f" />
              <ellipse cx="16" cy="9" rx="9" ry="6" fill="#a3e635" />
              <path d="M16 3 C18.5 3.2 20.5 4.5 21 7 L16 6.8 Z" fill="#65a30d" />
              <circle cx="20" cy="7.2" r="1.4" fill="#ffffff" />
              <circle cx="20.6" cy="7" r="0.7" fill="#0f172a" />
            </svg>
          </div>
        </div>
        <div className="fish-swimmer fish-swimmer--reverse bottom-[-16px]" style={{ animationDuration: '12s', animationDelay: '-8s' }}>
          <div className="fish-bob -scale-x-100" style={{ animationDuration: '2.6s' }}>
            <svg width="18" height="11" viewBox="0 0 30 18">
              <path d="M1 9 C4 3 8 3 11 9 C8 15 4 15 1 9 Z" fill="#ca8a04" />
              <ellipse cx="16" cy="9" rx="9" ry="6" fill="#fde047" />
              <circle cx="20" cy="7.2" r="1.4" fill="#ffffff" />
              <circle cx="20.6" cy="7" r="0.7" fill="#0f172a" />
            </svg>
          </div>
        </div>
        <div className="fish-swimmer bottom-[-24px]" style={{ animationDuration: '21s', animationDelay: '-14s' }}>
          <div className="fish-bob" style={{ animationDuration: '3.5s', animationDelay: '-2s' }}>
            <svg width="22" height="13" viewBox="0 0 30 18">
              <path d="M1 9 C4 3 8 3 11 9 C8 15 4 15 1 9 Z" fill="#b91c1c" />
              <ellipse cx="16" cy="9" rx="9" ry="6" fill="#f87171" />
              <path d="M16 3 C18.5 3.2 20.5 4.5 21 7 L16 6.8 Z" fill="#ef4444" />
              <circle cx="20" cy="7.2" r="1.4" fill="#ffffff" />
              <circle cx="20.6" cy="7" r="0.7" fill="#0f172a" />
            </svg>
          </div>
        </div>
      </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="relative w-full max-w-sm mx-auto">
        {/* Mobile brand header */}
        <div className="md:hidden flex flex-col items-center text-center mb-8">
          <div className="relative h-12 w-12 mb-2">
            <Image src="/logo.png" alt="LCC Hub Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight italic text-white">
            LCCian <span className="text-blue-200">Hub</span>
          </h1>
          <p className="text-sm text-white/80 font-medium mt-1">
            Your Campus Life, Simplified.
          </p>
        </div>

        <Card className="relative w-full shadow-lg border-border bg-card overflow-hidden">
          <CardHeader className="space-y-1 flex flex-col items-center text-center">
            <div className="relative h-12 w-12 mb-2 hidden md:block">
              <Image src="/logo.png" alt="LCC Hub Logo" fill className="object-contain" priority />
            </div>
            <CardTitle className="text-xl">Sign in to LCC Hub</CardTitle>
            <CardDescription>
              Enter your Student ID and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-14">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {submitted && hasValidationError && (
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
                  inputMode="numeric"
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

              <div className="flex gap-3 p-3 bg-muted rounded-md border border-border">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  First login might take a minute while we securely sync your official school records.
                </p>
              </div>
            </form>
          </CardContent>
          {/* Animated blue wave */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 overflow-hidden">
            <svg className="wave-layer text-primary opacity-20" viewBox="0 0 960 64" preserveAspectRatio="none">
              <path d="M0 32 C60 -8 180 -8 240 32 S420 72 480 32 S660 -8 720 32 S900 72 960 32 V64 H0 Z" fill="currentColor" />
            </svg>
            <svg className="wave-layer wave-layer--slow text-primary opacity-35" viewBox="0 0 960 64" preserveAspectRatio="none">
              <path d="M0 44 C60 16 180 16 240 44 S420 72 480 44 S660 16 720 44 S900 72 960 44 V64 H0 Z" fill="currentColor" />
            </svg>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
