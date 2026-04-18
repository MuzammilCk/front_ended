import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { type Order } from "../../api/types";
import { adminUpdateOrderStatus, adminGetOrder, adminListOrders } from "../../api/admin";
import { useAdminData } from "../../context/AdminContext";

const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function OrderStatusStepper({ currentStatus, orderId, onStatusChange }: { currentStatus: string, orderId: string, onStatusChange: (id: string, s: string) => void }) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIdx = ORDER_STEPS.indexOf(currentStatus);
  
  if (isCancelled) {
    return (
      <div className="flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-sm">
        <span className="text-rose-400 text-xs font-sans uppercase tracking-widest">Order Cancelled</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#c9a96e] to-[#e8c87a] transition-all duration-700"
          style={{ width: `${((currentIdx + 1) / ORDER_STEPS.length) * 100}%` }}
        />
      </div>
      
      {/* Step dots */}
      <div className="flex justify-between relative z-10 -mt-2.5">
        {ORDER_STEPS.map((step, idx) => (
          <button
            key={step}
            onClick={() => idx > currentIdx && onStatusChange(orderId, step)}
            disabled={idx <= currentIdx}
            title={idx > currentIdx ? `Advance to ${step}` : step}
            className={`flex flex-col items-center gap-1 group bg-[#0A0705] pt-0.5 ${idx > currentIdx ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-3 h-3 rounded-full border transition-all duration-300
              ${idx < currentIdx ? 'bg-[#c9a96e] border-[#c9a96e]' : ''}
              ${idx === currentIdx ? 'bg-[#c9a96e] border-[#c9a96e] ring-4 ring-[#c9a96e]/20' : ''}
              ${idx > currentIdx ? 'bg-[#0A0705] border-white/20 group-hover:border-[#c9a96e]/50' : ''}
            `} />
            <span className={`font-sans text-[9px] uppercase tracking-widest transition-colors mt-1
              ${idx === currentIdx ? 'text-[#c9a96e]' : 'text-muted/50'}
              ${idx > currentIdx ? 'group-hover:text-muted/60' : ''}
            `}>
              {step}
            </span>
          </button>
        ))}
      </div>
      
      {/* Danger zone: cancel button */}
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to cancel this order?")) {
            onStatusChange(orderId, 'cancelled');
          }
        }}
        className="text-[9px] font-sans uppercase tracking-[0.2em] text-rose-400/40 hover:text-rose-400 transition-colors mt-6 block"
      >
        ✕ Cancel Order
      </button>
    </div>
  );
}

export default function OrdersTab() {
  const queryClient = useQueryClient();
  const { orders: initialOrders } = useAdminData(); // Primary aggregated metric data
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 4. FILTER CHIPS RE-QUERY (Local API Query overriding the initial context load for live tables)
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-orders-table', statusFilter, fromDate, toDate],
    queryFn: () => adminListOrders({ 
      limit: 100, 
      status: statusFilter === 'all' ? undefined : statusFilter,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
  });

  const ordersList = pageData?.data || [];

  // 3. OPTIMISTIC UI + REACT QUERY mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminUpdateOrderStatus(orderId, { status }),
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-orders-table'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['admin-orders-table', statusFilter, fromDate, toDate]);
      
      // Optimistically update
      queryClient.setQueryData(['admin-orders-table', statusFilter, fromDate, toDate], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((o: Order) =>
            o.id === orderId ? { ...o, status } : o
          ),
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['admin-orders-table', statusFilter, fromDate, toDate], context.previous);
      }
    },
    onSettled: () => {
      // Invalidate to ensure accuracy across all tabs/orders globally
      void queryClient.invalidateQueries({ queryKey: ['admin-orders-table'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    }
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    statusMutation.mutate({ orderId, status: newStatus });
  };

  // 2. BULK SHIP / MARK DELIVERED
  const handleBulkStatus = async (status: 'shipped' | 'delivered') => {
    try {
      await Promise.all(selectedOrderIds.map(id => adminUpdateOrderStatus(id, { status })));
      void queryClient.invalidateQueries({ queryKey: ['admin-orders-table'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrderIds([]);
      // Render simple toast/alert equivalent
      alert(`Successfully marked ${selectedOrderIds.length} orders as ${status}.`);
    } catch {
      alert("Error occurred while updating orders.");
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const isAllSelected = ordersList.length > 0 && selectedOrderIds.length === ordersList.length;
  const toggleAll = () => {
    if (isAllSelected) setSelectedOrderIds([]);
    else setSelectedOrderIds(ordersList.map(o => o.id));
  };

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

  const currency = initialOrders.length > 0 ? initialOrders[0].currency : 'INR';
  const sumRev = (items: Order[]) => items.reduce((s, o) => s + parseFloat(o.total_amount), 0);
  
  const todayOrders = initialOrders.filter(o => o.created_at.startsWith(new Date().toISOString().split('T')[0]));
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekOrders = initialOrders.filter(o => new Date(o.created_at) >= weekAgo);
  const thisMonthOrders = initialOrders.filter(o => o.created_at.startsWith(new Date().toISOString().slice(0, 7)));

  const monthlyData: Record<string, { orders: number, revenue: number }> = {};
  initialOrders.forEach(o => {
    const d = new Date(o.created_at);
    const month = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) monthlyData[month] = { orders: 0, revenue: 0 };
    monthlyData[month].orders += 1;
    monthlyData[month].revenue += parseFloat(o.total_amount);
  });
  const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }));
  const maxMonthly = monthlyArray.length > 0 ? Math.max(...monthlyArray.map(m => m.orders)) : 1;

  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/30 transition-colors";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today", orders: todayOrders.length, rev: sumRev(todayOrders) },
          { label: "This Week", orders: thisWeekOrders.length, rev: sumRev(thisWeekOrders) },
          { label: "This Month", orders: thisMonthOrders.length, rev: sumRev(thisMonthOrders) },
          { label: "All Time", orders: initialOrders.length, rev: sumRev(initialOrders) },
        ].map((s, i) => (
          <div key={i} className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 hover:border-[#c9a96e]/25 transition-colors">
            <p className="text-[10px] tracking-[0.22em] uppercase text-muted/25">{s.label}</p>
            <p className="font-serif text-3xl font-light text-[#c9a96e] mt-1">{s.orders.toLocaleString()}</p>
            <p className="text-[10px] text-muted/25">{currency} {s.rev.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-5 border-b border-[#c9a96e]/5 flex items-center justify-between">
          <div>
            <p className="font-serif text-xl font-light text-[#e8dcc8] mb-2">Order Matrix</p>
            {/* 4. FILTER CHIPS */}
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`font-sans text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors border
                    ${statusFilter === s ? 'bg-[#c9a96e]/10 text-[#c9a96e] border-[#c9a96e]/50' : 'bg-transparent text-muted/40 border-white/10 hover:border-white/20 hover:text-muted/60'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
             <span className="text-muted/50">—</span>
             <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
             {(fromDate || toDate) && (
               <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-[10px] text-muted/40 hover:text-rose-400 uppercase tracking-widest font-sans ml-2">Clear Date</button>
             )}
          </div>
        </div>
        
        {/* 2. BULK ACTION BAR */}
        {selectedOrderIds.length > 0 && (
          <div className="sticky top-[80px] z-20 flex items-center gap-4 bg-[#c9a96e]/8 border-b border-[#c9a96e]/25 px-6 py-3 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <span className="font-sans text-xs font-medium text-[#c9a96e]">
              {selectedOrderIds.length} orders selected
            </span>
            <div className="flex gap-3 ml-auto">
              <button 
                onClick={() => void handleBulkStatus('shipped')} 
                 className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans text-[10px] tracking-wider uppercase px-4 py-2 hover:bg-emerald-500/20 transition-colors"
                title="Only applies to Pending or Processing orders. Re-shipped tracking not supported natively in bulk."
              >
                Mark as Shipped
              </button>
              <button 
                onClick={() => void handleBulkStatus('delivered')} 
                className="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-sans text-[10px] tracking-wider uppercase px-4 py-2 hover:bg-sky-500/20 transition-colors"
              >
                Mark as Delivered
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_2fr] py-3 px-6 border-b border-[#c9a96e]/5">
           <div>
            <input 
              type="checkbox" 
              className="accent-[#c9a96e]"
              checked={isAllSelected}
              onChange={toggleAll}
            />
           </div>
          {["Order ID", "Customer", "Amount", "Date", "Pipeline Status"].map(h => (
            <span key={h} className="text-[10px] tracking-[0.2em] uppercase text-muted/45 font-sans">{h}</span>
          ))}
        </div>
        
        {isLoading ? (
           <p className="py-8 text-center text-xs text-muted/40 font-sans animate-pulse">Loading orders...</p>
        ) : ordersList.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted/40 font-sans">No orders match the current filters.</p>
        ) : (
          ordersList.map((o: Order) => (
            <div key={o.id} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_2fr] py-4 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors">
              <div onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  className="accent-[#c9a96e]"
                  checked={selectedOrderIds.includes(o.id)}
                  onChange={() => toggleSelectOrder(o.id)}
                />
              </div>
              <span className="font-serif text-[#c9a96e] font-light cursor-pointer" onClick={() => setSelectedOrder(o)}>#{o.id.slice(-6)}</span>
              <span className="text-xs text-[#e8dcc8] font-light font-sans cursor-pointer" onClick={() => setSelectedOrder(o)}>{o.buyer_id.slice(-6)}</span>
              <span className="text-xs text-[#e8dcc8] font-sans">
                {o.currency} {parseFloat(o.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-muted/40 font-sans tracking-wide">
                {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              
              <div onClick={e => e.stopPropagation()}>
                {/* Visual pipeline tag indicator without the full stepper UI to keep the table clean */}
                <span className={`font-sans font-medium text-[9px] tracking-[0.1em] uppercase px-3 py-1 w-fit rounded-sm border
                  ${o.status === "cancelled" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    o.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    o.status === "shipped" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                    o.status === "processing" ? "bg-[#c9a96e]/10 text-[#c9a96e] border-[#c9a96e]/30" :
                    "bg-white/5 text-muted/40 border-white/10"
                  }`}
                >
                  {o.status}
                </span>
                <button 
                  onClick={() => setSelectedOrder(o)}
                  className="ml-4 font-sans text-[9px] uppercase tracking-widest text-[#c9a96e]/40 hover:text-[#c9a96e]"
                >
                  Manage →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">Monthly Breakdown</p>
        </div>
        <div className="grid grid-cols-4 py-3 px-6 border-b border-[#c9a96e]/5">
          {["Month", "Orders", "Revenue", "Volume"].map(h => (
            <span key={h} className="text-[10px] tracking-[0.2em] font-sans uppercase text-muted/45">{h}</span>
          ))}
        </div>
        {monthlyArray.map((m, i) => (
          <div key={i} className="grid grid-cols-4 py-4 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors">
            <span className="font-serif font-light text-[#e8dcc8]">{m.month}</span>
            <span className="text-xs font-sans text-[#c9a96e]">{m.orders}</span>
            <span className="text-xs font-sans text-muted/50">{currency} {m.revenue.toLocaleString()}</span>
            <div className="h-0.5 bg-[#c9a96e]/8 overflow-hidden mt-1">
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
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted/40 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="text-muted/40 hover:text-rose-400">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {loadingDetails ? (
                 <p className="text-muted/40 font-sans text-xs animate-pulse">Loading details...</p>
               ) : orderDetails ? (
                 <>
                   {/* 1. VISUAL STATUS STEPPER IN ORDER DRAWER */}
                   <div>
                     <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted/50 mb-5">Fulfillment Pipeline</p>
                     <OrderStatusStepper 
                        currentStatus={ordersList.find((o: Order) => o.id === selectedOrder.id)?.status || selectedOrder.status}
                        orderId={selectedOrder.id}
                        onStatusChange={handleStatusChange}
                     />
                   </div>

                   {/* Items */}
                   <div>
                      <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted/50 mb-3">Manifest</p>
                      <div className="space-y-3">
                         {(orderDetails.items || []).map((item: any) => (
                           <div key={item.id} className="flex justify-between items-start pb-3 border-b border-white/5">
                              <div>
                                 <p className="text-[#e8dcc8] font-serif text-sm">{item.title}</p>
                                 <p className="text-[10px] font-sans text-muted/40 mt-0.5">SKU: {item.sku} · Qty: {item.qty}</p>
                              </div>
                              <p className="text-[#c9a96e] text-sm font-sans">{item.currency} {item.line_total}</p>
                           </div>
                         ))}
                         {(!orderDetails.items || orderDetails.items.length === 0) && (
                           <p className="text-xs font-sans text-muted/40">No item details available.</p>
                         )}
                      </div>
                   </div>

                   {/* Pricing Summary */}
                   <div className="bg-[#130e08] p-5 border border-[#c9a96e]/10 space-y-3 font-sans">
                     <div className="flex justify-between text-xs text-muted/60"><p>Subtotal</p><p>{selectedOrder.currency} {selectedOrder.subtotal}</p></div>
                     <div className="flex justify-between text-xs text-muted/60"><p>Shipping</p><p>{selectedOrder.currency} {selectedOrder.shipping_fee}</p></div>
                     <div className="flex justify-between text-xs text-emerald-400/60"><p>Discount</p><p>- {selectedOrder.currency} {selectedOrder.discount_amount}</p></div>
                     <div className="pt-3 mt-3 border-t border-white/5 flex justify-between">
                       <p className="text-sm font-light tracking-wide text-[#e8dcc8]">Total</p>
                       <p className="text-sm text-[#c9a96e] font-medium">{selectedOrder.currency} {parseFloat(selectedOrder.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                     </div>
                   </div>

                   {/* Customer Data */}
                   <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted/50 mb-3 font-sans">Logistics</p>
                      <div className="space-y-3 text-xs text-muted/60 font-sans">
                        {orderDetails.order?.contact && (
                          <div className="bg-[#130e08] p-4 border border-white/5">
                            <p className="text-[#e8dcc8] mb-1.5 uppercase font-sans text-[10px] tracking-widest text-muted/40">Contact Data</p>
                            <p className="font-mono text-muted/70">{orderDetails.order.contact}</p>
                          </div>
                        )}
                        {orderDetails.order?.shipping_address && (
                          <div className="bg-[#130e08] p-4 border border-white/5">
                            <p className="text-[#e8dcc8] mb-1.5 uppercase font-sans text-[10px] tracking-widest text-muted/40">Destination</p>
                            <p className="whitespace-pre-wrap leading-relaxed text-muted/70">{orderDetails.order.shipping_address}</p>
                          </div>
                        )}
                      </div>
                   </div>
                 </>
               ) : (
                 <p className="text-rose-400 text-xs font-sans">Failed to load payload.</p>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
