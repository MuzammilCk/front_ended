import type { Order } from "../../api/types";
import { ORDER_STATUS_CLS } from "../../api/types";

export default function OrdersTab({ orders = [] }: { orders?: Order[] }) {
  const currency = orders.length > 0 ? orders[0].currency : 'INR';
  const sumRev = (items: Order[]) => items.reduce((s, o) => s + parseFloat(o.total_amount), 0);
  
  const todayOrders = orders.filter(o => o.created_at.startsWith(new Date().toISOString().split('T')[0]));
  const thisMonthOrders = orders.filter(o => o.created_at.startsWith(new Date().toISOString().slice(0, 7)));

  // monthly breakdown
  const monthlyData: Record<string, { orders: number, revenue: number }> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const month = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) monthlyData[month] = { orders: 0, revenue: 0 };
    monthlyData[month].orders += 1;
    monthlyData[month].revenue += parseFloat(o.total_amount);
  });
  const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({
    month, ...data
  }));
  const maxMonthly = monthlyArray.length > 0 ? Math.max(...monthlyArray.map(m => m.orders)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Today",
            orders: todayOrders.length,
            rev: sumRev(todayOrders),
          },
          {
            label: "This Week",
            orders: todayOrders.length, // approximation based on today
            rev: sumRev(todayOrders),
          },
          {
            label: "This Month",
            orders: thisMonthOrders.length,
            rev: sumRev(thisMonthOrders),
          },
          { label: "All Time", orders: orders.length, rev: sumRev(orders) },
        ].map((s, i) => (
          <div
            key={i}
            className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors"
          >
            <p className="text-[10px] tracking-[0.22em] uppercase text-muted/25">
              {s.label}
            </p>
            <p className="font-serif text-3xl font-light text-[#c9a96e] mt-1">
              {s.orders.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted/25">
              AED {s.rev.toLocaleString()}
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
          <span className="text-[10px] tracking-[0.15em] uppercase text-muted/20">
            Recent list
          </span>
        </div>
        <div className="grid grid-cols-5 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Order ID", "Customer", "Amount", "Date", "Status"].map(
            (h) => (
              <span
                key={h}
                className="text-[10px] tracking-[0.2em] uppercase text-muted/20"
              >
                {h}
              </span>
            ),
          )}
        </div>
        {orders.map((o, i) => (
          <div
            key={i}
            className="grid grid-cols-5 py-4 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif text-[#c9a96e] font-light">#{o.id.slice(-6)}</span>
            <span className="text-xs text-[#e8dcc8] font-light">
              {o.buyer_id.slice(-6)}
            </span>
            <span className="text-xs text-[#e8dcc8]">{o.currency} {parseFloat(o.total_amount).toFixed(2)}</span>
            <span className="text-[10px] text-muted/30">{new Date(o.created_at).toLocaleDateString()}</span>
            <span
              className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit ${ORDER_STATUS_CLS[o.status] || "bg-gray-500/10 text-gray-400"}`}
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
              className="text-[10px] tracking-[0.2em] uppercase text-muted/20"
            >
              {h}
            </span>
          ))}
        </div>
        {monthlyArray.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-4 py-3 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif font-light text-[#e8dcc8]">
              {m.month}
            </span>
            <span className="text-xs text-[#c9a96e]">{m.orders}</span>
            <span className="text-xs text-muted/50">
              AED {m.revenue.toLocaleString()}
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
