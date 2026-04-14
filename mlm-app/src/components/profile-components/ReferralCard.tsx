import { useState } from "react";
import { Gift, Copy, Check, Share2, Send, Sparkles } from "lucide-react";

export default function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://front-ended.vercel.app';
  const referralLink = `${baseUrl}/register?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join HADI Perfumes',
          text: 'Discover luxury fragrances at HADI. Use my invite link to unlock exclusive benefits!',
          url: referralLink,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing", err);
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
      <div className="p-6 border-b border-[#c9a96e]/10 flex items-center gap-2">
        <Gift className="w-5 h-5 text-[#c9a96e]" />
        <h2 className="text-xl font-light text-[#e8dcc8]">Referral Code</h2>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#c9a96e]/5 border border-[#c9a96e]/20">
          <code className="text-sm text-[#c9a96e]">{code}</code>

          <button onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[#c9a96e]" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#c9a96e] text-[#0a0705] rounded-lg text-sm font-medium tracking-wide hover:bg-[#c9a96e]/90 transition"
          >
            <Share2 className="w-4 h-4" />
            Share Invite
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition border ${copied
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-white/5 border-white/10 text-[#e8dcc8] hover:bg-white/10'
              }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link Copied" : "Copy Link"}
          </button>
        </div>

        <div className="pt-6 mt-6 space-y-4 border-t border-[#c9a96e]/10">
          <h3 className="text-sm font-medium text-[#e8dcc8]">How it works</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[#c9a96e]/10">
                <Send className="w-3.5 h-3.5 text-[#c9a96e]" />
              </div>
              <p className="text-sm text-white/50 leading-snug">
                Share your unique invite link directly with friends.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[#c9a96e]/10">
                <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" />
              </div>
              <p className="text-sm text-white/50 leading-snug">
                They get exclusive perks on their first HADI experience.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[#c9a96e]/10">
                <Gift className="w-3.5 h-3.5 text-[#c9a96e]" />
              </div>
              <p className="text-sm text-white/50 leading-snug">
                You earn direct wallet commissions on their orders.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}