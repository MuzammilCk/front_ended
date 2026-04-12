export default function ActivityList({ activities }) {
  return (
    <div className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
      <div className="p-6 border-b border-[#c9a96e]/10">
        <h2 className="text-xl font-light text-[#e8dcc8]">Recent Activity</h2>
      </div>

      <div className="divide-y divide-[#c9a96e]/10">
        {activities.map((a, i) => (
          <div key={i} className="flex justify-between p-4 hover:bg-[#c9a96e]/5">
            <div>
              <p>{a.action}</p>
              <p className="text-xs text-muted/60">{a.date}</p>
            </div>
            <div className="text-right">
              <p>{a.status}</p>
              {a.amount && (
                <p className="text-xs">{a.amount}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}