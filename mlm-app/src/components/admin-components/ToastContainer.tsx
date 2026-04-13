const VARIANT_STYLES = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  error:   'bg-rose-500/10 border-rose-500/30 text-rose-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  info:    'bg-sky-500/10 border-sky-500/30 text-sky-400',
};

const VARIANT_ICONS = {
  success: '✓', error: '⚠', warning: '⚠', info: 'ℹ',
};

export function ToastContainer({ toasts, onDismiss }: { toasts: any[], onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 border px-4 py-3 pointer-events-auto
            font-sans text-xs tracking-wide max-w-sm shadow-2xl backdrop-blur-sm
            animate-[slideInRight_0.3s_ease-out] font-medium
            ${VARIANT_STYLES[toast.variant as keyof typeof VARIANT_STYLES]}`}
        >
          <span className="shrink-0">{VARIANT_ICONS[toast.variant as keyof typeof VARIANT_ICONS]}</span>
          <span className="flex-1 drop-shadow-md">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current/40 hover:text-current/80 transition-colors px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
