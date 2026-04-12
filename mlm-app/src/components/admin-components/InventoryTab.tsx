import { useState } from 'react';
import { adminAddStock, adminAdjustStock } from '../../api/admin';
import { useAdminData } from '../../context/AdminContext';

export default function InventoryTab() {
  const { products, refreshListings: onRefresh } = useAdminData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addQty, setAddQty] = useState<number>(1);
  const [setQty, setSetQty] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddStock = async (id: string, qty: number) => {
    if (qty < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      await adminAddStock(id, { qty });
      setSuccess(`Successfully added ${qty} stock.`);
      await onRefresh();
      setExpandedId(null);
    } catch {
      setError('Failed to add stock.');
    } finally {
      setLoading(false);
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
    
    setLoading(true); setError(''); setSuccess('');
    try {
      await adminAdjustStock(id, { newTotalQty, reason: reasonText });
      setSuccess(`Successfully adjusted stock to ${newTotalQty}.`);
      await onRefresh();
      setExpandedId(null);
    } catch {
      setError('Failed to adjust stock.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors";
  const labelCls = "block text-[9px] tracking-[0.2em] uppercase text-muted/35 mb-1.5";

  return (
    <div className="space-y-6 max-w-5xl">
       <div className="flex items-center justify-between">
         <p className="font-serif text-2xl font-light text-[#e8dcc8]">Inventory Management</p>
         <input 
            className={`${inputCls} w-64`}
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
       </div>

       {success && (
         <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
           {success}
         </div>
       )}
       {error && (
         <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
           ⚠ {error}
         </div>
       )}

       <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
         <div className="grid grid-cols-5 py-3 px-5 border-b border-[#c9a96e]/5">
           {["Product Name", "Current Stock", "Status", "Price", "Actions"].map(h => (
             <span key={h} className="text-[10px] tracking-[0.2em] uppercase text-muted/20">
               {h}
             </span>
           ))}
         </div>
         {filtered.length === 0 ? (
           <p className="py-8 text-center text-xs text-muted/40">No products found.</p>
         ) : (
           filtered.map(p => (
             <div key={p.id}>
               <div className={`grid grid-cols-5 py-4 px-5 items-center hover:bg-[#c9a96e]/3 transition-colors ${expandedId === p.id ? 'bg-[#c9a96e]/5' : 'border-b border-[#c9a96e]/4'}`}>
                 <span className="font-serif text-lg font-light text-[#e8dcc8]">{p.name}</span>
                 <span className={`text-xs ${p.stock < 15 ? 'text-amber-400' : 'text-[#e8dcc8]'}`}>
                   {p.stock} units {p.stock < 15 && '⚠ Low'}
                 </span>
                 <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border w-fit ${p.active ? 'text-emerald-400 border-emerald-500/20' : 'text-muted/30 border-white/10'}`}>
                   {p.active ? 'Active' : 'Hidden'}
                 </span>
                 <span className="text-[11px] text-[#c9a96e]">INR {p.price}</span>
                 <div>
                   <button 
                     onClick={() => {
                        setExpandedId(expandedId === p.id ? null : p.id);
                        setAddQty(1);
                        setSetQty(p.stock);
                        setReason('');
                     }}
                     className="text-[10px] tracking-widest uppercase text-[#c9a96e]/60 hover:text-[#c9a96e] border border-[#c9a96e]/20 px-3 py-1.5 transition-colors"
                   >
                     {expandedId === p.id ? 'Close' : 'Manage'}
                   </button>
                 </div>
               </div>
               
               {expandedId === p.id && (
                 <div className="px-5 py-6 bg-[#000000]/40 border-b border-[#c9a96e]/10">
                   <div className="flex items-end gap-6">
                     <div>
                       <label className={labelCls}>Quick Add</label>
                       <div className="flex gap-2">
                         <input type="number" min="1" value={addQty} onChange={e => setAddQty(Number(e.target.value))} className={`${inputCls} w-20`} />
                         <button 
                           onClick={() => void handleAddStock(p.id, addQty)} 
                           disabled={loading}
                           className="bg-[#c9a96e] text-[#080604] text-[10px] uppercase tracking-widest px-4 font-light disabled:opacity-50 hover:bg-[#e8c87a] transition-colors"
                         >
                           + Add
                         </button>
                       </div>
                     </div>
                     
                     <div className="w-px h-10 bg-[#c9a96e]/10" />
                     
                     <div className="flex-1 flex items-end gap-3">
                       <div>
                         <label className={labelCls}>Set Absolute Total</label>
                         <input type="number" min="0" value={setQty} onChange={e => setSetQty(Number(e.target.value))} className={`${inputCls} w-20`} />
                       </div>
                       <div className="flex-1">
                         <label className={labelCls}>Reason for adjustment</label>
                         <input 
                           type="text" 
                           value={reason} 
                           onChange={e => setReason(e.target.value)} 
                           placeholder="Reason (min 5 chars)" 
                           className={`${inputCls} w-full`} 
                         />
                       </div>
                       <button 
                         onClick={() => void handleAdjustStock(p.id, setQty, reason)} 
                         disabled={loading}
                         className="border border-[#c9a96e]/25 text-[#c9a96e] text-[10px] uppercase tracking-widest px-4 py-2 font-light hover:bg-[#c9a96e]/10 disabled:opacity-50 transition-colors h-9"
                       >
                         Apply
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
  );
}
