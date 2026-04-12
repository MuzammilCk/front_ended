import { ShieldAlert } from 'lucide-react';

export default function DisputesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <ShieldAlert className="w-9 h-9 text-amber-400" />
      </div>
      <div>
        <h2 className="font-serif text-2xl font-light text-[#e8dcc8] mb-2">Disputes</h2>
        <p className="text-sm text-muted/40 max-w-md">
          Dispute management is coming soon. You'll be able to review, mediate, and resolve buyer–seller disputes directly from this panel.
        </p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5">
        Coming Soon
      </span>
    </div>
  );
}
