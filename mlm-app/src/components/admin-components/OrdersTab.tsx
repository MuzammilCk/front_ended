import { useState, useEffect } from "react";
import type { Order } from "../../api/types";
import { ORDER_STATUS_CLS } from "../../api/types";
import { adminUpdateOrderStatus, adminGetOrder } from "../../api/admin";

interface OrdersTabProps {
  orders?: Order[];
}

export default function OrdersTab({ orders: initialOrders = [] }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const currency = orders.length > 0 ? orders[0].currency : 'INR';
  const sumRev = (items: Order[]) => items.reduce((s, o) => s + parseFloat(o.total_amount), 0);
  
  const todayOrders = orders.filter(o => o.created_at.startsWith(new Date().toISOString().split('T')[0]));
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
  
  const thisMonthOrders = orders.filter(o => o.created_at.startsWith(new Date().toISOString().slice(0, 7)));

  // Date Range Filtering
  const dateFiltered = orders.filter(o => {
    if (fromDate && o.created_at < fromDate) return false;
    if (toDate && o.created_at > toDate + 'T23:59:59') return false;
    return true;
  });

  // Monthly breakdown
  const monthlyData: Record<string, { orders: number, revenue: number }> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const month = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) monthlyData[month] = { orders: 0, revenue: 0 };
    monthlyData[month].orders += 1;
    monthlyData[month].revenue += parseFloat(o.total_amount);
  });
  const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }));
  const maxMonthly = monthlyArray.length > 0 ? Math.max(...monthlyArray.map(m => m.orders)) : 1;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await adminUpdateOrderStatus(orderId, { status: newStatus });
    } catch {
      // Revert if API call fails
      const original = initialOrders.find(o => o.id === orderId)?.status;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: original || o.status } : o));
    }
  };

  // Drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setLoadingDetails(true);
      adminGetOrder(selectedOrder.id)
        .then(res => setOrderDetails(res))
        .catch(() => {})
        .finally(() => setLoadingDetails(false));
    } else {
      setOrderDetails(null);
    }
  }, [selectedOrder]);

  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/30 transition-colors";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today", orders: todayOrders.length, rev: sumRev(todayOrders) },
          { label: "This Week", orders: thisWeekOrders.length, rev: sumRev(thisWeekOrders) },
          { label: "This Month", orders: thisMonthOrders.length, rev: sumRev(thisMonthOrders) },
          { label: "All Time", orders: orders.length, rev: sumRev(orders) },
        ].map((s, i) => (
          <div key={i} className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors">
            <p className="text-[10px] tracking-[0.22em] uppercase text-muted/25">{s.label}</p>
            <p className="font-serif text-3xl font-light text-[#c9a96e] mt-1">{s.orders.toLocaleString()}</p>
            <p className="text-[10px] text-muted/25">{currency} {s.rev.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5 flex items-center justify-between">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">All Orders</p>
          
          <div className="flex items-center gap-3">
             <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
             <span className="text-muted/30">—</span>
             <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
             {(fromDate || toDate) && (
               <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-[10px] text-muted/40 hover:text-rose-400">Clear</button>
             )}
          </div>
        </div>
        
        <div className="grid grid-cols-5 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Order ID", "Customer", "Amount", "Date", "Status"].map(h => (
            <span key={h} className="text-[10px] tracking-[0.2em] uppercase text-muted/20">{h}</span>
          ))}
        </div>
        
        {dateFiltered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted/40">No orders found.</p>
        ) : (
          dateFiltered.map((o) => (
            <div key={o.id} className="grid grid-cols-5 py-4 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors cursor-pointer" onClick={() => setSelectedOrder(o)}>
              <span className="font-serif text-[#c9a96e] font-light">#{o.id.slice(-6)}</span>
              <span className="text-xs text-[#e8dcc8] font-light">{o.buyer_id.slice(-6)}</span>
              <span className="text-xs text-[#e8dcc8]">{o.currency} {parseFloat(o.total_amount).toFixed(2)}</span>
              <span className="text-[10px] text-muted/30">{new Date(o.created_at).toLocaleDateString()}</span>
              
              <div onClick={e => e.stopPropagation()}>
                <select
                  value={o.status}
                  onChange={e => handleStatusChange(o.id, e.target.value)}
                  className="bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-[10px] px-2 py-1 outline-none focus:border-[#c9a96e]/50 capitalize"
                >
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <option key={s} value={s} className="bg-[#130e08] capitalize">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">Monthly Breakdown</p>
        </div>
        <div className="grid grid-cols-4 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Month", "Orders", "Revenue", "Volume"].map(h => (
            <span key={h} className="text-[10px] tracking-[0.2em] uppercase text-muted/20">{h}</span>
          ))}
        </div>
        {monthlyArray.map((m, i) => (
          <div key={i} className="grid grid-cols-4 py-3 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors">
            <span className="font-serif font-light text-[#e8dcc8]">{m.month}</span>
            <span className="text-xs text-[#c9a96e]">{m.orders}</span>
            <span className="text-xs text-muted/50">{currency} {m.revenue.toLocaleString()}</span>
            <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a]/50" style={{ width: `${Math.round((m.orders / maxMonthly) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#080604]/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="w-[480px] bg-[#0A0705] border-l border-[#c9a96e]/10 relative z-10 h-full flex flex-col shadow-2xl transition-transform animate-slideInRight">
            <div className="p-6 border-b border-[#c9a96e]/10 flex items-center justify-between">
               <div>
                  <p className="font-serif text-2xl font-light text-[#e8dcc8]">Order #{selectedOrder.id.slice(-6)}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted/40 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="text-muted/40 hover:text-rose-400">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {loadingDetails ? (
                 <p className="text-muted/40 text-xs animate-pulse">Loading details...</p>
               ) : orderDetails ? (
                 <>
                   {/* Status */}
                   <div>
                     <p className="text-[10px] tracking-[0.2em] uppercase text-muted/30 mb-3">Status</p>
                     <select
                        value={orders.find(o => o.id === selectedOrder.id)?.status || selectedOrder.status}
                        onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                        className="w-full bg-[#130e08] border border-[#c9a96e]/20 text-[#e8dcc8] text-sm px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 capitalize"
                      >
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                   </div>

                   {/* Items */}
                   <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted/30 mb-3">Items</p>
                      <div className="space-y-3">
                         {(orderDetails.items || []).map((item: any) => (
                           <div key={item.id} className="flex justify-between items-start pb-3 border-b border-white/5">
                              <div>
                                 <p className="text-[#e8dcc8] text-sm">{item.title}</p>
                                 <p className="text-[10px] text-muted/40 mt-0.5">SKU: {item.sku} · Qty: {item.qty}</p>
                              </div>
                              <p className="text-[#c9a96e] text-sm">{item.currency} {item.line_total}</p>
                           </div>
                         ))}
                         {(!orderDetails.items || orderDetails.items.length === 0) && (
                           <p className="text-xs text-muted/40">No item details available.</p>
                         )}
                      </div>
                   </div>

                   {/* Pricing Summary */}
                   <div className="bg-[#130e08] p-4 border border-[#c9a96e]/10 space-y-2">
                     <div className="flex justify-between text-xs text-muted/60"><p>Subtotal</p><p>{selectedOrder.subtotal}</p></div>
                     <div className="flex justify-between text-xs text-muted/60"><p>Shipping</p><p>{selectedOrder.shipping_fee}</p></div>
                     <div className="flex justify-between text-xs text-emerald-400/60"><p>Discount</p><p>- {selectedOrder.discount_amount}</p></div>
                     <div className="pt-2 mt-2 border-t border-white/5 flex justify-between">
                       <p className="text-sm font-light tracking-wide text-[#e8dcc8]">Total</p>
                       <p className="text-sm text-[#c9a96e] font-medium">{selectedOrder.currency} {selectedOrder.total_amount}</p>
                     </div>
                   </div>

                   {/* Customer Data */}
                   <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted/30 mb-3">Customer & Shipping</p>
                      <div className="space-y-3 text-xs text-muted/60">
                        {orderDetails.order?.contact && (
                          <div className="bg-[#130e08] p-3 border border-white/5">
                            <p className="text-[#e8dcc8] mb-1">Contact Info</p>
                            <p className="font-mono">{orderDetails.order.contact}</p>
                          </div>
                        )}
                        {orderDetails.order?.shipping_address && (
                          <div className="bg-[#130e08] p-3 border border-white/5">
                            <p className="text-[#e8dcc8] mb-1">Shipping Address</p>
                            <p className="whitespace-pre-wrap">{orderDetails.order.shipping_address}</p>
                          </div>
                        )}
                      </div>
                   </div>
                 </>
               ) : (
                 <p className="text-rose-400 text-xs">Failed to load details.</p>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
