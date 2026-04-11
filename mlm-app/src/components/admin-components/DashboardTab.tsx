import type { AdminTabType, AdminProductType } from "../../api/types";
import { ORDER_STATUS_CLS } from "../../api/types";
import type { Order } from "../../api/types";

interface DashboardTabProps {
  products: AdminProductType[];
  orders: Order[];
  ordersTotal: number;
  chartMode: "weekly" | "monthly";
  setChartMode: (mode: "weekly" | "monthly") => void;
  setTab: (tab: AdminTabType) => void;
}

export default function DashboardTab({
  products,
  orders,
  ordersTotal,
  chartMode,
  setChartMode,
  setTab,
}: DashboardTabProps) {
  const totalRevenueNum = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0);
  const avgOrderValueNum = orders.length > 0 ? totalRevenueNum / orders.length : 0;

  const currency = orders.length > 0 ? orders[0].currency : 'INR';
  const totalRevenue = ordersTotal > 0 ? `${currency} ${totalRevenueNum.toLocaleString()}` : "—";
  const avgOrderValue = ordersTotal > 0 ? `${currency} ${avgOrderValueNum.toFixed(0)}` : "—";
  const totalOrdersStr = ordersTotal > 0 ? String(ordersTotal) : "—";

  // Chart data: Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toISOString().split("T")[0],
      orders: 0,
      revenue: 0,
    };
  });

  orders.forEach((o) => {
    const d = o.created_at.split("T")[0];
    const match = last7Days.find((x) => x.date === d);
    if (match) {
      match.orders += 1;
      match.revenue += parseFloat(o.total_amount || "0");
    }
  });

  const chartMax = orders.length > 0 ? Math.max(1, ...last7Days.map((d) => d.orders)) : 1;

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: totalRevenue,
            sub: "Calculated from recent orders",
            color: "text-[#c9a96e]",
          },
          {
            label: "Total Orders",
            value: totalOrdersStr,
            sub: "All time",
            color: "text-sky-400",
          },
          {
            label: "Active Products",
            value: String(products.filter((p) => p.active).length),
            sub: `${products.length} total`,
            color: "text-emerald-400",
          },
          {
            label: "Avg Order Value",
            value: avgOrderValue,
            sub: "Based on recent orders",
            color: "text-rose-400",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors duration-300"
          >
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#c9b99a]/25">
              {k.label}
            </p>
            <p
              className={`font-serif text-3xl font-light mt-2 mb-1 ${k.color}`}
            >
              {k.value}
            </p>
            <p className="text-[10px] text-[#c9b99a]/25">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-serif text-xl font-light text-[#e8dcc8]">
                Order Volume
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9b99a]/25">
                Last 7 days
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2 h-44">
            {orders.length === 0 ? (
              <div className="w-full h-full flex flex-col justify-center items-center text-[#c9b99a]/40">
                <p>No order data yet</p>
              </div>
            ) : (
              last7Days.map((d, i) => {
                const pct = Math.round((d.orders / chartMax) * 100);
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 flex-1 h-full group"
                  >
                    <div className="w-full flex-1 bg-[#c9a96e]/5 relative overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#c9a96e] to-[#e8c87a]/50 transition-all duration-700 group-hover:brightness-125"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#c9b99a]/25 tracking-wide">
                      {d.day}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#c9a96e]/5 flex gap-8">
            {[
              { label: "Total Orders", value: totalOrdersStr },
              {
                label: "Total Revenue",
                value: totalRevenue,
              },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[10px] tracking-[0.18em] uppercase text-[#c9b99a]/25">
                  {s.label}
                </p>
                <p className="font-serif text-lg font-light text-[#c9a96e]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
          <p className="font-serif text-xl font-light text-[#e8dcc8] mb-1">
            Top Sellers
          </p>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9b99a]/25 mb-6">
            By revenue · all time
          </p>
          <div className="space-y-5">
            {products.length === 0 ? (
               <p className="text-[#c9b99a]/40 text-sm">No products</p>
            ) : (
                products.slice(0, 5).map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif text-sm font-light text-[#e8dcc8]">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#c9a96e]">
                        —
                      </span>
                    </div>
                    <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a]/50"
                        style={{ width: `0%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#c9b99a]/25 mt-0.5">
                      —
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">
            Recent Orders
          </p>
          <button
            onClick={() => setTab("orders")}
            className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-4 py-2 hover:bg-[#c9a96e]/8 transition-colors duration-300"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-4 py-2 border-b border-[#c9a96e]/5 mb-1">
          {["Order ID", "Customer ID", "Amount", "Status"].map((h) => (
            <span
              key={h}
              className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/20"
            >
              {h}
            </span>
          ))}
        </div>
        {orders.length === 0 ? (
            <p className="text-[#c9b99a]/40 py-4">No recent orders.</p>
        ) : (
          orders.slice(0, 5).map((o, i) => (
            <div
              key={i}
              className="grid grid-cols-4 py-3 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
            >
              <span className="font-serif text-[#c9a96e] font-light">#{o.id.slice(-6)}</span>
              <span className="text-xs text-[#e8dcc8] font-light">
                {o.buyer_id.slice(-6)}
              </span>
              <span className="text-xs text-[#e8dcc8]">{o.currency} {parseFloat(o.total_amount).toFixed(2)}</span>
              <span
                className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit ${ORDER_STATUS_CLS[o.status] || "bg-gray-500/10 text-gray-400"}`}
              >
                {o.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
