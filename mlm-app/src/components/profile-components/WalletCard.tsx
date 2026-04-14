import { Wallet } from "lucide-react";

export default function WalletCard({ balance, pending }: { balance: number; pending?: number }) {
  return (
    <div style={{ perspective: '800px' }}>
      <div className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl transition-transform duration-300 ease-out hover:[transform:rotateX(3deg)_rotateY(-3deg)]">
        <div className="p-6 border-b border-[#c9a96e]/10 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#c9a96e]" />
          <h2 className="text-xl font-light text-[#e8dcc8]">Wallet</h2>
        </div>

        <div className="p-6 text-center">
          <p className="text-sm text-muted/60">Available Balance</p>
          <p className="mt-2 text-4xl font-light text-[#c9a96e]">
            INR {balance.toFixed(2)}
          </p>
          {pending !== undefined && pending > 0 && (
            <p className="mt-1 text-xs text-muted/50">
              + ₹{pending.toFixed(2)} pending
            </p>
          )}
          <p className="mt-4 text-xs text-muted/40 text-center leading-relaxed">
            Balance is credited automatically from referral commissions.
          </p>
        </div>
      </div>
    </div>
  );
}