import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListReturns, adminApproveReturn, adminRejectReturn, adminCompleteReturn } from '../../api/admin';
import type { ReturnRequest } from '../../api/types';
import { useAdminToast } from '../../hooks/useAdminToast';
import { PackageX, History, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_TABS = [
  { id: 'all', label: 'All Returns' },
  { id: 'pending_review', label: 'Pending Review' },
  { id: 'approved', label: 'Approved & Transit' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved', label: 'Closed/Resolved' },
];

export default function ReturnsTab() {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('pending_review');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: returnsRes, isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: () => adminListReturns({ limit: 200 }),
  });

  const allReturns = returnsRes?.data || [];

  const filteredReturns = allReturns.filter(ret => {
    // Tab filtering
    if (activeTab === 'pending_review' && ret.status !== 'pending_review') return false;
    if (activeTab === 'approved' && ret.status !== 'approved') return false;
    if (activeTab === 'escalated' && ret.status !== 'escalated') return false;
    if (activeTab === 'resolved' && !['rejected', 'completed'].includes(ret.status)) return false;
    
    // Search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ret.id.toLowerCase().includes(q) && !ret.order_id.toLowerCase().includes(q) && !ret.buyer_id.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: 'approve' | 'reject' | 'complete'; note?: string }) => {
      if (action === 'approve') return adminApproveReturn(id, note);
      if (action === 'reject') return adminRejectReturn(id, note);
      if (action === 'complete') return adminCompleteReturn(id, note);
      throw new Error("Invalid action");
    },
    onSuccess: () => {
      addToast('Return request updated successfully', 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to update return request', 'error');
    }
  });

  const handleAction = (id: string, action: 'approve' | 'reject' | 'complete') => {
    const note = window.prompt(`Optional note for ${action}ing this return:`);
    if (note !== null) { // if not cancelled
      updateMutation.mutate({ id, action, note });
    }
  };

  const statusBadgeCls = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'escalated': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-white/5 text-white/50 border-white/10';
      default: return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-[#e8dcc8]">Returns Desk</h1>
          <p className="font-sans text-xs text-white/40 mt-1">Manage product returns and reverse logistics</p>
        </div>
        <div className="flex gap-4 text-xs font-sans bg-[#0d0a07] border border-[#c9a96e]/10 px-6 py-3 rounded-sm shadow-xl items-center">
          <History className="w-4 h-4 text-[#c9a96e]/60" />
           <span className="text-white/70 font-medium tracking-wide">{allReturns.length} Total</span>
        </div>
      </div>

      <div className="bg-[#0d0a07] border border-[#c9a96e]/10 shadow-xl rounded-sm">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-[#c9a96e]/10 gap-4">
          <div className="flex gap-2 bg-[#130e08] p-1 border border-white/5 rounded-sm">
            {STATUS_TABS.map(tab => {
              const count = tab.id === 'all' ? allReturns.length : 
                            tab.id === 'resolved' ? allReturns.filter(r => ['completed','rejected'].includes(r.status)).length :
                            allReturns.filter(r => r.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-sans text-[10px] uppercase tracking-widest font-medium px-4 py-2 transition-all rounded-sm flex items-center gap-2
                    ${activeTab === tab.id ? 'bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20' : 'text-muted/40 hover:text-white border border-transparent'}`}
                >
                  {tab.label} <span className={`px-1.5 py-0.5 rounded-sm text-[9px] ${activeTab === tab.id ? 'bg-[#c9a96e]/20' : 'bg-white/5'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/30" />
             <input 
               type="text" 
               placeholder="Search id, order, user..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-[#130e08] border border-[#c9a96e]/15 text-[#e8dcc8] text-[11px] pl-9 pr-4 py-2 w-full outline-none focus:border-[#c9a96e]/50 transition-colors rounded-sm"
             />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="p-8 space-y-4 animate-pulse">
               {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#c9a96e]/5 rounded-sm" />)}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <PackageX className="w-12 h-12 text-[#c9a96e]/20 mb-4" />
              <p className="font-serif text-xl text-[#e8dcc8]">No returns found</p>
              <p className="font-sans text-xs text-white/30 mt-2 max-w-sm">
                {searchQuery ? 'Try adjusting your search terms.' : 'No return requests currently match this status.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left font-sans text-xs border-collapse">
               <thead>
                  <tr className="border-b border-[#c9a96e]/10 bg-white/5 text-[10px] uppercase tracking-widest text-[#c9a96e]/60">
                     <th className="px-6 py-4 font-medium">Return ID & Date</th>
                     <th className="px-6 py-4 font-medium">Order / User</th>
                     <th className="px-6 py-4 font-medium">Reason</th>
                     <th className="px-6 py-4 font-medium">Status</th>
                     <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#c9a96e]/5">
                 {filteredReturns.map((ret, idx) => (
                   <tr key={ret.id} 
                       className={`group hover:bg-[#c9a96e]/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#130e08]/30'}`}>
                     <td className="px-6 py-4">
                       <span className="font-mono text-[#e8dcc8]" title={ret.id}>{ret.id.split('-')[0]}-{ret.id.split('-')[1]?.slice(0,4)}</span>
                       <span className="block text-[10px] text-muted/40 mt-1 uppercase tracking-widest">
                         {new Date(ret.created_at).toLocaleDateString()}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <div className="space-y-1">
                         <button onClick={() => navigate(`/admin/orders`)} className="font-mono text-[#c9a96e]/80 hover:text-[#c9a96e] hover:underline" title={ret.order_id}>
                           {ret.order_id.slice(0,12)}
                         </button>
                         <span className="block text-[10px] text-white/30 font-mono tracking-tight" title={ret.buyer_id}>
                           {ret.buyer_id.slice(0,12)}
                         </span>
                       </div>
                     </td>
                     <td className="px-6 py-4 max-w-[200px]">
                       <span className="text-[#c9a96e] font-medium text-[10px] uppercase tracking-widest block mb-0.5">{ret.reason_code.replace(/_/g, ' ')}</span>
                       <span className="text-white/60 truncate block" title={ret.reason_detail || ''}>{ret.reason_detail || 'No details provided'}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2 py-1 border text-[9px] uppercase font-medium tracking-widest rounded-sm ${statusBadgeCls(ret.status)}`}>
                         {ret.status.replace('_', ' ')}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                         {ret.status === 'pending_review' && (
                           <>
                             <button onClick={() => handleAction(ret.id, 'reject')} disabled={updateMutation.isPending} className="px-3 py-1.5 border border-rose-500/20 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-[9px] uppercase tracking-widest transition-colors rounded-sm">Reject</button>
                             <button onClick={() => handleAction(ret.id, 'approve')} disabled={updateMutation.isPending} className="px-3 py-1.5 border border-[#c9a96e]/20 text-[#c9a96e] bg-[#c9a96e]/10 hover:bg-[#c9a96e]/20 text-[9px] uppercase tracking-widest transition-colors rounded-sm">Approve</button>
                           </>
                         )}
                         {(ret.status === 'approved' || ret.status === 'escalated') && (
                           <button onClick={() => handleAction(ret.id, 'complete')} disabled={updateMutation.isPending} className="px-3 py-1.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-[9px] uppercase tracking-widest transition-colors rounded-sm">Mark Complete</button>
                         )}
                         {['rejected', 'completed'].includes(ret.status) && (
                           <span className="text-[10px] text-muted/30 uppercase tracking-widest">No Actions</span>
                         )}
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
