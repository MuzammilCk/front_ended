import {
  dailyOrders,
  monthlyOrders,
  totalOrders,
  totalRevenue,
  recentOrders,
  statusCls,
  maxMonthly,
} from "../../data/adminStore";

export default function OrdersTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Today",
            orders: dailyOrders[4].orders,
            rev: dailyOrders[4].revenue,
          },
          {
            label: "This Week",
            orders: dailyOrders.reduce((s, d) => s + d.orders, 0),
            rev: dailyOrders.reduce((s, d) => s + d.revenue, 0),
          },
          {
            label: "This Month",
            orders: monthlyOrders[11].orders,
            rev: monthlyOrders[11].revenue,
          },
          { label: "This Year", orders: totalOrders, rev: totalRevenue },
        ].map((s, i) => (
          <div
            key={i}
            className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors"
          >
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#c9b99a]/25">
              {s.label}
            </p>
            <p className="font-serif text-3xl font-light text-[#c9a96e] mt-1">
              {s.orders.toLocaleString()}
            </p>
            <p className="text-[10px] text-[#c9b99a]/25">
              INR {s.rev.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5 flex items-center justify-between">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">
            All Orders
          </p>
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#c9b99a]/20">
            5 most recent
          </span>
        </div>
        <div className="grid grid-cols-6 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Order ID", "Customer", "Product", "Amount", "Date", "Status"].map(
            (h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/20"
              >
                {h}
              </span>
            ),
          )}
        </div>
        {recentOrders.map((o, i) => (
          <div
            key={i}
            className="grid grid-cols-6 py-4 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif text-[#c9a96e] font-light">{o.id}</span>
            <span className="text-xs text-[#e8dcc8] font-light">
              {o.customer}
            </span>
            <span className="text-xs text-[#c9b99a]/45">{o.product}</span>
            <span className="text-xs text-[#e8dcc8]">INR {o.amount}</span>
            <span className="text-[10px] text-[#c9b99a]/30">{o.date}</span>
            <span
              className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit ${statusCls[o.status]}`}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">
            Monthly Breakdown
          </p>
        </div>
        <div className="grid grid-cols-4 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Month", "Orders", "Revenue", "Volume"].map((h) => (
            <span
              key={h}
              className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/20"
            >
              {h}
            </span>
          ))}
        </div>
        {monthlyOrders.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-4 py-3 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif font-light text-[#e8dcc8]">
              {m.month}
            </span>
            <span className="text-xs text-[#c9a96e]">{m.orders}</span>
            <span className="text-xs text-[#c9b99a]/50">
              INR {m.revenue.toLocaleString()}
            </span>
            <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a]/50"
                style={{
                  width: `${Math.round((m.orders / maxMonthly) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
