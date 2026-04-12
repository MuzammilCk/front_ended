import { Banknote } from 'lucide-react';

export default function PayoutsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Banknote className="w-9 h-9 text-emerald-400" />
      </div>
      <div>
        <h2 className="font-serif text-2xl font-light text-[#e8dcc8] mb-2">Payouts</h2>
        <p className="text-sm text-muted/40 max-w-md">
          Payout management is coming soon. You'll be able to review commission earnings, approve payouts, and track disbursements from this panel.
        </p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5">
        Coming Soon
      </span>
    </div>
  );
}
