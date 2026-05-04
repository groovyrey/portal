import { useState } from 'react';
import { AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="relative h-12 w-12 mb-2">
            <Image 
              src="/logo.png" 
              alt="LCC Hub Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl">LCC Hub</CardTitle>
          <CardDescription>
            Enter your Student ID and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Student ID</Label>
              <Input
                id="userId"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                maxLength={20}
                placeholder="0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={64}
                  placeholder="Your portal password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <Label 
                htmlFor="terms" 
                className="text-xs text-muted-foreground leading-snug font-normal cursor-pointer"
              >
                I agree to the <Link href="/disclaimer" className="underline underline-offset-4 hover:text-primary">Disclaimer</Link> and data policy.
              </Label>
            </div>

            {error && (
              <div className="flex flex-col gap-2 p-3 bg-destructive/10 rounded-md text-destructive transition-all text-xs">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
                {requiresPasswordChange && portalUrl && (
                  <Button asChild variant="destructive" size="sm" className="w-full h-8 text-[10px]">
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                      Change Password on Portal
                    </a>
                  </Button>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="flex gap-3 p-3 bg-muted rounded-md border border-border">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                First login might take a minute while we securely sync your official school records.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
