import { useState } from 'react';
import { LayoutDashboard, User, Lock, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  onLogin: (id: string, pass: string) => void;
  loading: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, loading, error }: LoginFormProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    onLogin(userId, password);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
        <div className="p-8 pb-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-6">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Enter your credentials to access your portal</p>
        </div>
        
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Student ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-sm font-medium"
                  placeholder="e.g. 20241322"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 px-1.5 py-1">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/10 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-normal font-medium cursor-pointer">
                I agree to the <Link href="/disclaimer" className="text-blue-600 font-bold hover:underline">Terms of Service</Link> and acknowledge how my data is used for my convenience.
              </label>
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-xs font-medium leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors mt-2 ${
                loading || !agreedToTerms ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  Connecting...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">
                <span className="font-bold text-slate-700">Note:</span> Your first login may take up to a minute while we securely sync your real-time academic records from the school portal.
              </p>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Help</h3>
            </div>
            <ul className="space-y-3">
              <li className="text-xs text-slate-500 leading-normal flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Use your official Student ID and Portal Password.
              </li>
              <li className="text-xs text-slate-500 leading-normal flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Data is fetched directly from the school servers.
              </li>
            </ul>
          </div>
          
          <div className="mt-8 text-center pt-6 opacity-40">
            <p className="text-[10px] text-slate-400">
              LCC and Schoolista are trademarks of their respective owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
