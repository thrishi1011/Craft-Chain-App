import React, { useState } from 'react';
import { X, LogIn, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';

interface JoinProjectModalProps {
  onClose: () => void;
}

const JoinProjectModal = ({ onClose }: JoinProjectModalProps) => {
  const { currentUser } = useAuth();
  const { joinProject } = useApp();
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleJoin = async () => {
    Sounds.click();
    if (!code.trim()) { setError('Enter a code'); Sounds.error(); setShaking(true); setTimeout(() => setShaking(false), 400); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = joinProject(code.trim(), currentUser!);
    setLoading(false);
    if (result.success) {
      Sounds.join();
      addToast('success', `Joined "${result.projectName}"!`);
      onClose();
    } else {
      setError(result.error || 'Failed to join');
      Sounds.error();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-elevated border border-border rounded-2xl w-full max-w-sm mx-4 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn size={20} className="text-craft-green" />
            <span className="text-xs text-foreground">JOIN A PROJECT</span>
          </div>
          <button onClick={() => { Sounds.dismiss(); onClose(); }} className="hover:text-craft-red hover:bg-red-dim/20 rounded-lg p-1 text-muted-foreground"><X size={20} /></button>
        </div>

        <div className="px-6 py-5">
          <div className="bg-green-dim rounded-full p-4 mx-auto w-fit mb-4">
            <Users size={48} className="text-craft-green" />
          </div>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter the invite code shared by your project owner</p>

          <label className="text-[9px] text-muted-foreground mb-1.5 block">INVITE CODE</label>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            maxLength={8}
            placeholder="XXXXXX"
            className={`w-full text-center font-mono font-bold text-xl tracking-[0.3em] text-craft-green bg-bg-input border-2 border-border rounded-xl px-4 py-4 focus:border-craft-green focus:shadow-glow-green outline-none transition-all ${shaking ? 'animate-shake' : ''}`}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">Codes are 6 characters, case-insensitive</p>

          {error && (
            <div className="flex items-center gap-1 justify-center mt-2 text-xs text-craft-red animate-fade-in">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-border flex gap-3">
          <button onClick={() => { Sounds.dismiss(); onClose(); }} className="border border-border text-muted-foreground rounded-lg px-5 py-2.5 text-sm hover:bg-elevated">Cancel</button>
          <button onClick={handleJoin} disabled={loading}
            className="flex-1 bg-craft-green text-primary-foreground font-bold text-sm rounded-lg px-6 py-2.5 hover:shadow-glow-green active:scale-95 transition-all disabled:opacity-50">
            {loading ? '⏳ Joining...' : 'JOIN PROJECT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinProjectModal;
