import { Wallet } from "lucide-react";

export default function WalletCard({ balance }) {
  return (
    <div className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
      <div className="p-6 border-b border-[#c9a96e]/10 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-[#c9a96e]" />
        <h2 className="text-xl font-light text-[#e8dcc8]">Wallet</h2>
      </div>

      <div className="p-6 text-center">
        <p className="text-sm text-[#c9b99a]/60">Available Balance</p>
        <p className="mt-2 text-4xl font-light text-[#c9a96e]">
          INR {balance.toFixed(2)}
        </p>
        <button className="w-full px-4 py-2 mt-6 text-sm rounded-lg text-[#c9a96e] border border-[#c9a96e]/30 hover:bg-[#c9a96e]/10">
          Add Funds
        </button>
      </div>
    </div>
  );
}