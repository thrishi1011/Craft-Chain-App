import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';

interface LoginPageProps {
  onSuccess: () => void;
  onSignup: () => void;
  onBack: () => void;
}

const LoginPage = ({ onSuccess, onSignup, onBack }: LoginPageProps) => {
  const { login, loginWithGoogle, resendVerification } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Sounds.click();
    setError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Sounds.error();
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      Sounds.success();
      addToast('success', 'Welcome back, crafter!');
      onSuccess();
    } else {
      Sounds.error();
      setError(result.error || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    Sounds.click();
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success) {
      Sounds.success();
      addToast('success', 'Signed in with Google!');
      onSuccess();
    } else {
      Sounds.error();
      setError(result.error || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg bg-void px-4">
      <div className="max-w-sm w-full bg-elevated border border-border rounded-2xl p-8 shadow-card animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-craft-green rounded-sm" />
          <span className="text-sm text-craft-green">CRAFTCHAIN</span>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Welcome back, Crafter</p>
        <div className="border-t border-border mt-4 mb-6" />

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">EMAIL ADDRESS</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="steve@example.com"
                className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue focus:ring-1 focus:ring-craft-blue/30 transition-all outline-none"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue focus:ring-1 focus:ring-craft-blue/30 transition-all outline-none"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-dim border border-craft-red/30 rounded-lg px-4 py-2 flex flex-col gap-2 animate-fade-in text-red-500 text-[10px]">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-craft-red shrink-0" />
                <span className="text-xs text-craft-red leading-tight">{error}</span>
              </div>
              {error.includes('verify your email') && (
                <button
                  onClick={async () => {
                    const res = await resendVerification();
                    if (res.success) addToast('success', 'Verification email sent!');
                    else addToast('error', res.error || 'Failed to resend email');
                  }}
                  className="text-craft-blue hover:text-blue-300 text-[10px] text-left underline font-bold"
                >
                  Resend verification link?
                </button>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-craft-green text-primary-foreground font-bold text-xs py-3 rounded-lg hover:shadow-glow-green active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? '⏳ PROCESSING...' : '⛏ LOGIN'}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[10px] text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-elevated border border-border text-foreground font-bold text-xs py-3 rounded-lg hover:border-craft-blue active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              SIGN IN WITH GOOGLE
            </button>
          </div>

          <p
            onClick={() => { Sounds.navigate(); onSignup(); }}
            className="text-xs text-craft-blue hover:text-blue-300 text-center mt-4 cursor-pointer"
          >
            New here? Create account →
          </p>
          <p
            onClick={() => { Sounds.navigate(); onBack(); }}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer mt-2 text-center"
          >
            ← Back
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
