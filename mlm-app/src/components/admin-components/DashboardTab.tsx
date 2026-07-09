import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_CLS } from "../../api/types";
import { useAdminData } from "../../context/AdminContext";
import { getAdminDashboardStats } from "../../api/admin";

export default function DashboardTab() {
  const navigate = useNavigate();
  // Pull from context for everything else (recent orders table, chart, etc)
  const { products, orders, ordersTotal } = useAdminData();

  // 4. REAL DASHBOARD API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: getAdminDashboardStats,
  });

  const currency = orders.length > 0 ? orders[0].currency : 'INR';

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock < 15);

  const topSellers = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);
  const maxPrice = topSellers.length > 0 ? topSellers[0].price : 1;

  // Local Chart Data derivation (retained for visual volume)
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

  // KPI Render Items
  const kpiItems = [
    {
      label: "Total Revenue",
      value: stats ? `${currency} ${Number(stats.total_revenue).toLocaleString()}` : null,
      sub: "Total incoming revenue",
      color: "text-[#c9a96e]",
    },
    {
      label: "Total Orders",
      value: stats ? String(stats.total_orders) : null,
      sub: "All time fulfillment",
      color: "text-sky-400",
    },
    {
      label: "Active Products",
      value: stats ? String(stats.active_products) : null,
      sub: "Currently visible catalogue",
      color: "text-emerald-400",
    },
    {
      label: "Avg Order Value",
      value: stats ? `${currency} ${Number(stats.avg_order_value).toLocaleString()}` : null,
      sub: "Based on all historic orders",
      color: "text-rose-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-4 gap-4">
        {kpiItems.map((k, i) => (
          <div
            key={i}
            className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors duration-300"
          >
            {/* 3. TYPOGRAPHY FIX: labels */}
            <p className="font-sans text-xs font-medium text-white/50 tracking-wide mb-2">
              {k.label}
            </p>
            
            {/* 2. SKELETON LOADERS vs Real Values */}
            {statsLoading || k.value === null ? (
              <div className="h-8 w-24 bg-[#c9a96e]/8 rounded animate-pulse my-2" />
            ) : (
              <p className={`font-serif text-3xl font-light mb-1 ${k.color}`}>
                {k.value}
              </p>
            )}

            {/* 3. TYPOGRAPHY FIX: subtext */}
            <p className="font-sans text-[10px] text-white/40 tracking-wide mt-1">
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* 7. LOW STOCK ALERT */}
      {lowStockProducts.length > 0 && (
        <div className="flex items-center gap-3 border border-amber-500/20 bg-amber-500/5 px-5 py-3">
          <span className="text-amber-400 text-sm">⚠</span>
          <span className="font-sans text-xs font-medium text-amber-400 tracking-wide">
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} below 15 units —{' '}
            <button onClick={() => navigate('/admin/inventory')} className="underline hover:text-amber-300">
              Manage stock →
            </button>
          </span>
        </div>
      )}

      {/* 5. QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '⊕', label: 'Add Product', action: () => navigate('/admin/products/new') },
          { icon: '⊟', label: 'Manage Stock', action: () => navigate('/admin/inventory') },
          { icon: '≡', label: `Pending Orders${pendingCount > 0 ? ` (${pendingCount})` : ''}`, action: () => navigate('/admin/orders') },
          { icon: '⊞', label: 'Categories', action: () => navigate('/admin/categories') },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-4 text-left hover:border-[#c9a96e]/30 transition-colors group"
          >
            <span className="font-mono text-[#c9a96e]/50 group-hover:text-[#c9a96e] text-lg transition-colors">{icon}</span>
            {/* Keeping the aesthetic caps for these abstract square buttons */}
            <p className="font-sans text-[10px] tracking-wide font-medium uppercase text-muted/40 mt-2 group-hover:text-muted/70 transition-colors">{label}</p>
          </button>
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
              <p className="font-sans text-[10px] uppercase font-medium tracking-wider text-muted/40 mt-0.5">
                Last 7 days
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2 h-44">
            {orders.length === 0 ? (
              <div className="w-full h-full flex flex-col justify-center items-center text-muted/40 font-sans text-xs">
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
                    <span className="font-sans text-[10px] text-muted/40 font-medium tracking-wide">
                      {d.day}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
          <p className="font-serif text-xl font-light text-[#e8dcc8] mb-1">
            Top Inventory
          </p>
          <p className="font-sans text-[10px] uppercase font-medium tracking-wider text-muted/40 mb-6">
            By catalog price
          </p>
          <div className="space-y-5">
            {topSellers.length === 0 ? (
               <p className="text-muted/40 text-sm font-sans">No products</p>
            ) : (
                topSellers.map((p, i) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif text-sm font-light text-[#e8dcc8] truncate max-w-[150px]">{p.name}</span>
                      <span className="font-sans text-[10px] font-medium text-[#c9a96e]">{currency} {p.price.toLocaleString()}</span>
                    </div>
                    <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a]/50 transition-all duration-700"
                        style={{ width: `${Math.round((p.price / maxPrice) * 100)}%` }}
                      />
                    </div>
                    <p className="font-sans text-[10px] text-muted/40 font-medium mt-1">
                      {p.active ? 'Active' : 'Hidden'} · Stock: {p.stock}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* 6. RECENT ORDERS TABLE */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">
            Recent Orders
          </p>
          <button
            onClick={() => navigate("/admin/orders")}
            className="font-sans font-medium text-[10px] tracking-wider uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-4 py-2 hover:bg-[#c9a96e]/8 transition-colors duration-300"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-4 py-2 border-b border-[#c9a96e]/5 mb-1">
          {["Order ID", "Customer ID", "Amount", "Status"].map((h) => (
            <span
              key={h}
              className="font-sans font-medium text-[10px] tracking-wider uppercase text-muted/40"
            >
              {h}
            </span>
          ))}
        </div>
        {orders.length === 0 ? (
            <p className="text-muted/40 py-4 font-sans text-xs">No recent orders.</p>
        ) : (
          orders.slice(0, 5).map((o, i) => (
            <div
              key={i}
              onClick={() => navigate(`/admin/orders?highlight=${o.id}`)}
              className="grid grid-cols-4 py-3 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/5 transition-colors cursor-pointer"
            >
              <span className="font-serif text-[#c9a96e] text-sm font-light">#{o.id.slice(-6)}</span>
              <span className="font-sans text-xs font-medium text-[#e8dcc8]/60">
                {o.buyer_id.slice(-6)}
              </span>
              <span className="font-sans text-xs font-medium text-[#e8dcc8]/80">{o.currency} {parseFloat(o.total_amount).toFixed(2)}</span>
              <span
                className={`font-sans font-medium text-[9px] tracking-wider uppercase px-2 py-0.5 w-fit rounded-sm ${ORDER_STATUS_CLS[o.status] || "bg-gray-500/10 text-gray-400"}`}
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
