import React, { useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, AlertCircle, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';
import type { User } from '@/types';

interface SignupPageProps {
  onSuccess: () => void;
  onLogin: () => void;
  onBack: () => void;
}

const roles: { role: User['role']; emoji: string; label: string; subtitle: string; color: string; dim: string; border: string }[] = [
  { role: 'Miner', emoji: '⛏️', label: 'MINER', subtitle: 'Gather resources', color: 'text-craft-green', dim: 'bg-green-dim', border: 'border-craft-green' },
  { role: 'Crafter', emoji: '🔨', label: 'CRAFTER', subtitle: 'Build items', color: 'text-craft-blue', dim: 'bg-blue-dim', border: 'border-craft-blue' },
  { role: 'Planner', emoji: '📋', label: 'PLANNER', subtitle: 'Coordinate team', color: 'text-craft-purple', dim: 'bg-purple-dim', border: 'border-craft-purple' },
];

const SignupPage = ({ onSuccess, onLogin, onBack }: SignupPageProps) => {
  const { signup } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Miner' as User['role'] });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const usernameValid = form.username.length >= 3 && !form.username.includes(' ');
  const passStrength = form.password.length >= 7 ? 3 : form.password.length >= 4 ? 2 : form.password.length >= 1 ? 1 : 0;

  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async () => {
    Sounds.click();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Sounds.error();
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    const result = await signup(form);
    setLoading(false);
    if (result.success) {
      Sounds.success();
      setEmailSent(true);
      addToast('success', 'Verification email sent!');
    } else {
      Sounds.error();
      setErrors(result.errors || {});
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg bg-void px-4 py-8">
        <div className="max-w-sm w-full bg-elevated border border-border rounded-2xl p-8 shadow-card text-center animate-slide-up">
          <div className="w-16 h-16 bg-craft-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} className="text-craft-green" />
          </div>
          <h2 className="text-xl font-pixel text-craft-green mb-4">VERIFY YOUR EMAIL</h2>
          <p className="text-sm text-muted-foreground mb-8">
            We've sent a verification link to <span className="text-foreground font-bold">{form.email}</span>.
            Please check your inbox and click the link to activate your account.
          </p>
          <button
            onClick={() => { Sounds.navigate(); onLogin(); }}
            className="w-full bg-craft-green text-primary-foreground font-bold text-xs py-3 rounded-lg hover:shadow-glow-green active:scale-95 transition-all duration-200"
          >
            BACK TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg bg-void px-4 py-8">
      <div className="max-w-sm w-full bg-elevated border border-border rounded-2xl p-8 shadow-card animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-craft-green rounded-sm" />
          <span className="text-sm text-craft-green">CRAFTCHAIN</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-6">CREATE YOUR ACCOUNT</p>
        <div className="border-t border-border mt-4 mb-6" />

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">USERNAME</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="SteveBuilder"
                className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue focus:ring-1 focus:ring-craft-blue/30 transition-all outline-none" />
            </div>
            {errors.username && <p className="text-xs text-craft-red flex items-center gap-1 mt-1 animate-fade-in"><AlertCircle size={12} />{errors.username}</p>}
          </div>

          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">EMAIL</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="steve@minecraft.net"
                className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue focus:ring-1 focus:ring-craft-blue/30 transition-all outline-none" />
            </div>
            {errors.email && <p className="text-xs text-craft-red flex items-center gap-1 mt-1 animate-fade-in"><AlertCircle size={12} />{errors.email}</p>}
          </div>

          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"
                className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue focus:ring-1 focus:ring-craft-blue/30 transition-all outline-none" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 w-8 rounded-full transition-colors ${passStrength >= i ? (i === 1 ? 'bg-craft-red' : i === 2 ? 'bg-craft-yellow' : 'bg-craft-green') : 'bg-border'}`} />
                  ))}
                </div>
                <span className={`text-[10px] ${passStrength === 1 ? 'text-craft-red' : passStrength === 2 ? 'text-craft-yellow' : 'text-craft-green'}`}>
                  {passStrength === 1 ? 'WEAK' : passStrength === 2 ? 'OK' : 'STRONG'}
                </span>
              </div>
            )}
            {errors.password && <p className="text-xs text-craft-red flex items-center gap-1 mt-1 animate-fade-in"><AlertCircle size={12} />{errors.password}</p>}
          </div>

          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">ROLE</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.role}
                  onClick={() => { Sounds.click(); setForm(f => ({ ...f, role: r.role })); }}
                  className={`rounded-lg p-3 cursor-pointer border-2 transition-all duration-200 text-center ${form.role === r.role ? `${r.border} ${r.dim}` : 'border-border bg-bg-input'}`}
                >
                  <div className="text-xl">{r.emoji}</div>
                  <div className={`text-[8px] mt-1 ${form.role === r.role ? r.color : 'text-foreground'}`}>{r.label}</div>
                  <div className="text-[10px] text-muted-foreground">{r.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSignup} disabled={loading}
            className="w-full bg-craft-green text-primary-foreground font-bold text-xs py-3 rounded-lg hover:shadow-glow-green active:scale-95 transition-all duration-200 disabled:opacity-50">
            {loading ? '⏳ CREATING...' : 'CREATE ACCOUNT'}
          </button>

          <p onClick={() => { Sounds.navigate(); onLogin(); }} className="text-xs text-craft-blue hover:text-blue-300 text-center mt-4 cursor-pointer">
            Already crafting? Log in →
          </p>
          <p onClick={() => { Sounds.navigate(); onBack(); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer mt-2 text-center">← Back</p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
