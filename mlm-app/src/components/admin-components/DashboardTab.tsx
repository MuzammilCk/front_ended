import {
  dailyOrders,
  monthlyOrders,
  maxDaily,
  maxMonthly,
  totalRevenue,
  totalOrders,
  topProducts,
  recentOrders,
  statusCls,
} from "../../data/adminStore";
import type { TabType, ProductType } from "../../data/adminStore";

interface DashboardTabProps {
  products: ProductType[];
  chartMode: "weekly" | "monthly";
  setChartMode: (mode: "weekly" | "monthly") => void;
  setTab: (tab: TabType) => void;
}

export default function DashboardTab({
  products,
  chartMode,
  setChartMode,
  setTab,
}: DashboardTabProps) {
  const chartData = chartMode === "weekly" ? dailyOrders : monthlyOrders;
  const chartMax = chartMode === "weekly" ? maxDaily : maxMonthly;

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: "AED 1.61M",
            sub: "+18% vs last year",
            color: "text-[#c9a96e]",
          },
          {
            label: "Orders This Month",
            value: "510",
            sub: "Dec · highest month",
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
            value: "AED 450",
            sub: "Up AED 23 MoM",
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
                {chartMode === "weekly"
                  ? "This week · daily"
                  : "This year · monthly"}
              </p>
            </div>
            <div className="flex gap-2">
              {(["weekly", "monthly"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={`text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 border transition-all duration-300
                    ${chartMode === m ? "border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10" : "border-[#c9a96e]/15 text-[#c9b99a]/25 hover:border-[#c9a96e]/30"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 h-44">
            {chartData.map((d, i) => {
              const pct = Math.round(((d as any).orders / chartMax) * 100);
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
                    {(d as any).day ?? (d as any).month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#c9a96e]/5 flex gap-8">
            {[
              { label: "Total Orders", value: totalOrders.toLocaleString() },
              {
                label: "Total Revenue",
                value: `AED ${totalRevenue.toLocaleString()}`,
              },
              { label: "Best Month", value: "Dec · 510 orders" },
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
            {topProducts.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-sm font-light text-[#e8dcc8]">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-[#c9a96e]">
                    AED {p.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a]/50"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#c9b99a]/25 mt-0.5">
                  {p.sales} units sold
                </p>
              </div>
            ))}
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
        <div className="grid grid-cols-5 py-2 border-b border-[#c9a96e]/5 mb-1">
          {["Order ID", "Customer", "Product", "Amount", "Status"].map((h) => (
            <span
              key={h}
              className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/20"
            >
              {h}
            </span>
          ))}
        </div>
        {recentOrders.map((o, i) => (
          <div
            key={i}
            className="grid grid-cols-5 py-3 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif text-[#c9a96e] font-light">{o.id}</span>
            <span className="text-xs text-[#e8dcc8] font-light">
              {o.customer}
            </span>
            <span className="text-xs text-[#c9b99a]/45">{o.product}</span>
            <span className="text-xs text-[#e8dcc8]">AED {o.amount}</span>
            <span
              className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit ${statusCls[o.status]}`}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
