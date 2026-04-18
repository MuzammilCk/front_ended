import { useState } from 'react';
import { adminAddStock, adminAdjustStock } from '../../api/admin';
import { useAdminData } from '../../context/AdminContext';

export default function InventoryTab() {
  const { products, refreshListings: onRefresh, loading: contextLoading } = useAdminData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addQty, setAddQty] = useState<number>(1);
  const [setQty, setSetQty] = useState<number>(0);
  const [reason, setReason] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddStock = async (id: string, qty: number) => {
    if (qty < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await adminAddStock(id, { qty });
      setSuccess(`Successfully added ${qty} unit(s) to stock.`);
      await onRefresh();
      if (expandedId === id) setExpandedId(null);
    } catch {
      setError('Failed to add stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustStock = async (id: string, newTotalQty: number, reasonText: string) => {
    if (newTotalQty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }
    if (reasonText.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await adminAdjustStock(id, { newTotalQty, reason: reasonText });
      setSuccess(`Successfully adjusted stock to ${newTotalQty}.`);
      await onRefresh();
      setExpandedId(null);
    } catch {
      setError('Failed to adjust stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors";
  const labelCls = "admin-label"; // updated typography

  return (
    <div className="space-y-6 max-w-6xl">
       <div className="flex items-center justify-between">
         <p className="font-serif text-2xl font-light text-[#e8dcc8]">Inventory Management</p>
         <input 
            className={`${inputCls} w-72`}
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
       </div>

       {success && (
         <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 font-sans font-medium tracking-wide text-xs text-emerald-400">
           {success}
         </div>
       )}
       {error && (
         <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 font-sans font-medium tracking-wide text-xs text-rose-400">
           ⚠ {error}
         </div>
       )}

       <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] shadow-lg overflow-x-auto">
         <div className="min-w-[800px]">
           <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] py-3 px-6 border-b border-[#c9a96e]/5">
           {["Product Name", "Current Stock", "Status", "Price", "Actions"].map(h => (
             <span key={h} className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted/45">
               {h}
             </span>
           ))}
         </div>
         
           {contextLoading ? (
             // 3. SKELETON LOADER
             Array(5).fill(null).map((_, i) => (
               <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] py-5 px-6 border-b border-[#c9a96e]/4 animate-pulse gap-4">
               <div className="h-4 w-48 bg-[#c9a96e]/8 rounded-sm" />
               <div className="h-4 w-16 bg-[#c9a96e]/8 rounded-sm" />
               <div className="h-4 w-12 bg-[#c9a96e]/8 rounded-sm" />
               <div className="h-4 w-20 bg-[#c9a96e]/8 rounded-sm" />
               <div className="h-6 w-32 bg-[#c9a96e]/8 rounded-sm" />
             </div>
           ))
         ) : filtered.length === 0 ? (
           <p className="py-12 text-center text-sm font-sans tracking-wide text-muted/40">No products found holding inventory metadata.</p>
         ) : (
           filtered.map(p => (
             <div key={p.id}>
               {/* 5. LOW STOCK HIGHLIGHT ROW */}
               <div className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] py-4 px-6 items-center transition-colors 
                 ${expandedId === p.id ? 'bg-[#c9a96e]/5' : 'border-b border-[#c9a96e]/4 hover:bg-[#c9a96e]/3'}
                 ${p.stock < 5 ? 'border-l-2 border-l-rose-500/60 bg-rose-500/5' : p.stock < 15 ? 'border-l-2 border-l-amber-500/40' : 'border-l-2 border-l-transparent'}
               `}>
                 <span className="font-sans text-sm font-medium text-[#e8dcc8]">{p.name}</span>
                 
                 <span className={`text-xs font-sans font-medium tracking-wide ${p.stock < 5 ? 'text-rose-400' : p.stock < 15 ? 'text-amber-400' : 'text-muted/60'}`}>
                   <span className="text-white/80">{p.stock}</span> units {p.stock < 5 ? '⚠ Critical' : p.stock < 15 ? '⚠ Low' : ''}
                 </span>
                 
                 <span className={`text-[9px] font-sans tracking-widest font-medium uppercase px-2.5 py-1 rounded-sm w-fit 
                    ${p.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-muted/40 border border-white/10'}
                 `}>
                   {p.active ? 'Active' : 'Hidden'}
                 </span>
                 
                 <span className="text-[11px] font-sans tracking-wide text-[#c9a96e]">INR {parseFloat(p.price.toString()).toLocaleString()}</span>
                 
                 {/* 4. INLINE QUICK-EDIT STOCK */}
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => void handleAddStock(p.id, 1)} 
                      disabled={actionLoading}
                      className="w-7 h-7 flex items-center justify-center font-sans font-medium border border-[#c9a96e]/20 bg-[#c9a96e]/5 text-[#c9a96e]/70 hover:text-[#c9a96e] hover:border-[#c9a96e]/50 hover:bg-[#c9a96e]/10 text-[10px] rounded-sm transition-all disabled:opacity-50"
                      title="Add 1 Unit"
                    >
                      +1
                    </button>
                    <button 
                      onClick={() => void handleAddStock(p.id, 10)} 
                      disabled={actionLoading}
                      className="w-8 h-7 flex items-center justify-center font-sans font-medium border border-[#c9a96e]/20 bg-[#c9a96e]/5 text-[#c9a96e]/70 hover:text-[#c9a96e] hover:border-[#c9a96e]/50 hover:bg-[#c9a96e]/10 text-[10px] rounded-sm transition-all disabled:opacity-50"
                      title="Add 10 Units"
                    >
                      +10
                    </button>
                    <button 
                      onClick={() => void handleAddStock(p.id, 50)} 
                      disabled={actionLoading}
                      className="w-8 h-7 flex items-center justify-center font-sans font-medium border border-[#c9a96e]/20 bg-[#c9a96e]/5 text-[#c9a96e]/70 hover:text-[#c9a96e] hover:border-[#c9a96e]/50 hover:bg-[#c9a96e]/10 text-[10px] rounded-sm transition-all disabled:opacity-50"
                      title="Add 50 Units"
                    >
                      +50
                    </button>
                    
                    <button 
                      onClick={() => {
                         setExpandedId(expandedId === p.id ? null : p.id);
                         setAddQty(1);
                         setSetQty(p.stock);
                         setReason('');
                      }}
                      className="text-[9px] font-sans font-medium tracking-widest uppercase text-muted/50 hover:text-white ml-2 transition-colors"
                    >
                      {expandedId === p.id ? 'Close' : 'Custom →'}
                    </button>
                 </div>
               </div>
               
               {expandedId === p.id && (
                 <div className="px-6 py-6 bg-[#000000]/60 border-b border-[#c9a96e]/10 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-end gap-8">
                     <div className="bg-[#130e08]/60 p-4 border border-white/5 rounded-sm">
                       <label className={labelCls}>Precise Addition</label>
                       <div className="flex gap-2">
                         <input type="number" min="1" value={addQty} onChange={e => setAddQty(Number(e.target.value))} className={`${inputCls} w-24`} />
                         <button 
                           onClick={() => void handleAddStock(p.id, addQty)} 
                           disabled={actionLoading}
                           className="bg-[#c9a96e] text-[#080604] font-sans font-medium text-[10px] uppercase tracking-widest px-5 disabled:opacity-50 hover:bg-[#e8c87a] transition-colors rounded-sm"
                         >
                           Add Stock
                         </button>
                       </div>
                     </div>
                     
                     <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#c9a96e]/20 to-transparent" />
                     
                     <div className="flex-1 flex gap-4 bg-[#130e08]/60 p-4 border border-white/5 rounded-sm items-end">
                       <div className="w-32">
                         <label className={labelCls}>Override Total</label>
                         <input type="number" min="0" value={setQty} onChange={e => setSetQty(Number(e.target.value))} className={`${inputCls} w-full`} />
                       </div>
                       <div className="flex-1">
                         <label className={labelCls}>Audit Log Reason (Required)</label>
                         <input 
                           type="text" 
                           value={reason} 
                           onChange={e => setReason(e.target.value)} 
                           placeholder="e.g. Audit correction, Warehouse damages..." 
                           className={`${inputCls} w-full`} 
                         />
                       </div>
                       <button 
                         onClick={() => void handleAdjustStock(p.id, setQty, reason)} 
                         disabled={actionLoading}
                         className="border border-[#c9a96e]/30 text-[#c9a96e] bg-[#c9a96e]/5 font-sans font-medium text-[10px] uppercase tracking-widest px-6 h-9 disabled:opacity-50 hover:bg-[#c9a96e]/20 transition-colors rounded-sm"
                       >
                         Apply Override
                       </button>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           ))
           )}
         </div>
       </div>
    </div>
  );
}
