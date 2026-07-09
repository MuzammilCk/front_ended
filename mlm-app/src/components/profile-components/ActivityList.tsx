import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  date: string;
  status: string;
  amount?: string;
}

function getStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "delivered") return "text-emerald-400/80 bg-emerald-400/8 border border-emerald-400/20";
  if (s === "cancelled" || s === "refunded") return "text-red-400/80 bg-red-400/8 border border-red-400/20";
  if (s === "processing" || s === "shipped") return "text-blue-400/80 bg-blue-400/8 border border-blue-400/20";
  return "text-[#c9a96e]/80 bg-[#c9a96e]/8 border border-[#c9a96e]/20"; // pending, default
}

export default function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="overflow-hidden bg-[#0d0a07]/40 rounded-2xl">
      <div className="p-6 border-b border-[#c9a96e]/10">
        <h2 className="text-xs uppercase tracking-widest text-[#c9a96e]/70">Purchase History</h2>
      </div>

      <div className="divide-y divide-[#c9a96e]/10">
        {activities.map((a, i) => {
          const isCredit = a.action.toLowerCase().startsWith('commission') || a.action.toLowerCase().startsWith('credit') || a.action.toLowerCase().startsWith('refund');

          return (
            <Link
              key={i}
              to={`/orders/${a.id}`}
              className="flex items-center justify-between p-4 hover:bg-[#c9a96e]/5 transition-colors group"
            >
              <div>
                <p className="text-[#e8dcc8] group-hover:text-[#c9a96e] transition-colors">{a.action}</p>
                <p className="text-xs text-muted/60">{a.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusStyle(a.status)}`}>
                    {a.status}
                  </span>
                  {a.amount && (
                    <p className={`text-xs ${isCredit ? 'text-emerald-400' : 'text-[#e8dcc8]'}`}>
                      {isCredit ? '+' : ''}{a.amount}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#c9a96e]/30 group-hover:text-[#c9a96e]/70 transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}