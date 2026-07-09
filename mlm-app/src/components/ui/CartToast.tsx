import type { ToastItem } from '../../hooks/useToast';

interface CartToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const variantStyles: Record<string, string> = {
  error:   'bg-rose-950 border-rose-500/40 text-rose-200',
  success: 'bg-emerald-950 border-emerald-500/40 text-emerald-200',
  warning: 'bg-amber-950 border-amber-500/40 text-amber-200',
  info:    'bg-[#1a1511] border-[#c9a96e]/30 text-[#e8dcc8]',
};

export default function CartToast({ toasts, onDismiss }: CartToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`flex items-start justify-between gap-4 px-4 py-3 border rounded-lg shadow-xl pointer-events-auto text-sm animate-[slideInLeft_0.3s_ease-out] ${variantStyles[t.variant] || variantStyles.info}`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition text-xs mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
