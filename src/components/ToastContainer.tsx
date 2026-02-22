import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';

const iconMap = {
  success: <CheckCircle2 size={16} className="text-craft-green shrink-0" />,
  error: <XCircle size={16} className="text-craft-red shrink-0" />,
  info: <Info size={16} className="text-craft-blue shrink-0" />,
  warning: <AlertTriangle size={16} className="text-craft-yellow shrink-0" />,
};

const borderMap = {
  success: 'border-craft-green/40 border-l-2 border-l-craft-green',
  error: 'border-craft-red/40 border-l-2 border-l-craft-red',
  info: 'border-craft-blue/40 border-l-2 border-l-craft-blue',
  warning: 'border-craft-yellow/40 border-l-2 border-l-craft-yellow',
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`min-w-72 max-w-sm bg-elevated border rounded-xl px-4 py-3 pointer-events-auto flex items-start gap-3 animate-slide-right shadow-2xl ${borderMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">{toast.message}</p>
            <p className="text-sm text-muted-foreground mt-0.5">just now</p>
          </div>
          <button
            onClick={() => { Sounds.dismiss(); removeToast(toast.id); }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-craft-green/60 rounded-full"
              style={{ animation: 'progressShrink 3.5s linear forwards' }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
