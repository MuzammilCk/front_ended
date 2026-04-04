import { Gift, Copy, Check } from "lucide-react";

export default function ReferralCard({ code, copied, onCopy }) {
  return (
    <div className="overflow-hidden border rounded-lg border-[#c9a96e]/10 bg-gradient-to-br from-[#c9a96e]/5 to-transparent">
      <div className="p-6 border-b border-[#c9a96e]/10 flex items-center gap-2">
        <Gift className="w-5 h-5 text-[#c9a96e]" />
        <h2 className="text-xl font-light text-[#e8dcc8]">Referral Code</h2>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#c9a96e]/5 border border-[#c9a96e]/20">
          <code className="text-sm text-[#c9a96e]">{code}</code>

          <button onClick={onCopy}>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[#c9a96e]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}