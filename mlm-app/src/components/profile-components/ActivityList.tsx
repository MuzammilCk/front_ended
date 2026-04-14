import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  date: string;
  status: string;
  amount?: string;
}

export default function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
      <div className="p-6 border-b border-[#c9a96e]/10">
        <h2 className="text-xl font-light text-[#e8dcc8]">Recent Activity</h2>
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
                <div className="text-right">
                  <p className="text-sm text-[#e8dcc8]">{a.status}</p>
                  {a.amount && (
                    <p className={`text-xs ${isCredit ? 'text-emerald-400' : 'text-muted/60'}`}>
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