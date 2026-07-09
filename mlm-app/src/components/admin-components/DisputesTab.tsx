import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListDisputes, adminResolveDispute, adminEscalateDispute, adminCloseDispute } from '../../api/admin';
import type { Dispute } from '../../api/types';
import { useAdminToast } from '../../hooks/useAdminToast';

const KANBAN_COLUMNS: { id: string; label: string; color: string; border: string }[] = [
  { id: 'open',       label: 'Open',       color: 'text-amber-400',   border: 'border-amber-500/20'  },
  { id: 'under_review',label: 'In Review', color: 'text-sky-400',     border: 'border-sky-500/20'    },
  { id: 'escalated',  label: 'Escalated',  color: 'text-rose-400',    border: 'border-rose-500/20'   },
  { id: 'resolved',   label: 'Resolved',   color: 'text-emerald-400', border: 'border-emerald-500/20'},
];

export default function DisputesTab() {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const queryClient = useQueryClient();
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragTargetCol, setDragTargetCol] = useState<string | null>(null);

  const { data: disputesRes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => adminListDisputes({ limit: 100 }),
  });

  const disputes = disputesRes?.data || [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      if (newStatus === 'under_review') {
        return adminResolveDispute(id, { resolution: 'under_review' });
      } else if (newStatus === 'escalated') {
        return adminEscalateDispute(id);
      } else if (newStatus === 'resolved') {
        return adminResolveDispute(id, { resolution: 'refund' }); // Default to refund for now
      } else if (newStatus === 'closed') {
        return adminCloseDispute(id);
      }
    },
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-disputes'] });
      const previousDisputes = queryClient.getQueryData(['admin-disputes']);
      queryClient.setQueryData(['admin-disputes'], (old: any) => ({
        ...old,
        data: old?.data?.map((d: Dispute) => d.id === id ? { ...d, status: newStatus } : d) || []
      }));
      return { previousDisputes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-disputes'], context?.previousDisputes);
      addToast('Failed to update dispute status', 'error');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    }
  });

  const updateStatus = (id: string, newStatus: string) => {
    updateMutation.mutate({ id, newStatus });
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragTargetCol(null);
    if (!draggedId) return;
    updateStatus(draggedId, colId);
    setDraggedId(null);
  };

  const openCount = disputes.filter(d => d.status === 'open').length;
  const inReviewCount = disputes.filter(d => d.status === 'under_review').length;
  const escalatedCount = disputes.filter(d => d.status === 'escalated').length;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl animate-in fade-in animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-[#c9a96e]/10 rounded mb-2" />
            <div className="h-4 w-64 bg-[#c9a96e]/10 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6 min-h-[600px]">
          {[1,2,3,4].map(col => (
             <div key={col} className="bg-[#0d0a07] border border-[#c9a96e]/10 p-4">
                <div className="h-6 w-24 bg-[#c9a96e]/10 rounded mb-4" />
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-32 bg-[#c9a96e]/5 rounded" />)}
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-[#e8dcc8]">Disputes Desk</h1>
          <p className="font-sans text-xs text-white/40 mt-1">Resolve customer disputes and escalations</p>
        </div>
        <div className="flex gap-4 text-xs font-sans bg-[#0d0a07] border border-[#c9a96e]/10 px-6 py-3 rounded-sm shadow-xl">
          <span className="text-amber-400 font-medium tracking-wide">{openCount} Open</span>
          <span className="text-white/20">|</span>
          <span className="text-sky-400 font-medium tracking-wide">{inReviewCount} In Review</span>
          <span className="text-white/20">|</span>
          <span className="text-rose-400 font-medium tracking-wide">{escalatedCount} Escalated</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 min-h-[600px]">
        {KANBAN_COLUMNS.map(col => (
          <div 
            key={col.id} 
            className={`flex flex-col border border-[#c9a96e]/10 bg-[#0d0a07] rounded-sm shadow-xl transition-all duration-300 ${dragTargetCol === col.id ? 'border-[#c9a96e]/40 shadow-[0_0_20px_rgba(201,169,110,0.1)]' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragTargetCol(col.id); }}
            onDragLeave={() => setDragTargetCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`px-5 py-4 border-b ${col.border} bg-white/5`}>
              <div className="flex items-center justify-between">
                <h3 className={`admin-table-header ${col.color}`}>{col.label}</h3>
                <span className="font-sans text-[10px] bg-black/40 px-2 py-0.5 text-white/40 border border-white/5">{disputes.filter(d => d.status === col.id).length}</span>
              </div>
            </div>

            <div className="p-4 flex-1 space-y-4 overflow-y-auto overflow-x-hidden relative min-h-[100px]">
              {disputes.filter(d => d.status === col.id).map(dispute => (
                <div
                  key={dispute.id}
                  draggable
                  onDragStart={() => setDraggedId(dispute.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`bg-[#130e08] border border-[#c9a96e]/15 p-4 cursor-grab active:cursor-grabbing hover:border-[#c9a96e]/40 transition-all rounded-sm shadow-md flex flex-col gap-3 group
                    ${draggedId === dispute.id ? 'opacity-40 scale-95' : 'hover:-translate-y-1'}`}
                >
                   <div className="flex justify-between items-start">
                     <p className="font-serif text-lg text-[#e8dcc8] leading-none tracking-tight truncate pr-2" title={dispute.id}>{dispute.id.split('-')[0]}-{dispute.id.split('-')[1]?.slice(0,4)}...</p>
                     <span className="font-sans text-[9px] text-muted/30 uppercase tabular-nums shrink-0">
                       {new Date(dispute.created_at).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                     </span>
                   </div>
                   
                   <p className="font-sans text-xs text-white/70 line-clamp-2 leading-relaxed">
                     <span className="text-[#c9a96e] mr-1 block text-[10px] uppercase font-medium tracking-widest">{dispute.reason_code.replace(/_/g, ' ')}</span>
                     {dispute.reason_detail || 'No detailed reason provided.'}
                   </p>
                   
                   <div className="font-sans text-[10px] space-y-1 mt-1 border-t border-[#c9a96e]/5 pt-3">
                     <p className="flex items-center gap-2">
                       <span className="text-muted/40 uppercase tracking-widest">Order:</span>
                       <button onClick={() => navigate(`/admin/orders`)} className="text-[#c9a96e]/60 hover:text-[#c9a96e] hover:underline font-mono tracking-tight" title={dispute.order_id}>{dispute.order_id.slice(0, 12)}...</button>
                     </p>
                     <p className="flex items-center gap-2">
                       <span className="text-muted/40 uppercase tracking-widest">User:</span>
                       <span className="text-white/40 font-mono tracking-tight" title={dispute.buyer_id}>{dispute.buyer_id.slice(0, 12)}...</span>
                     </p>
                   </div>
                   
                   {/* Action Triggers */}
                   <div className="flex gap-2 pt-3 mt-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                     {col.id === 'open' && (
                       <button onClick={() => updateStatus(dispute.id, 'under_review')} className="flex-1 bg-sky-500/10 text-sky-400 font-sans text-[9px] uppercase tracking-widest py-1.5 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">Review</button>
                     )}
                     {col.id !== 'escalated' && col.id !== 'resolved' && (
                       <button onClick={() => updateStatus(dispute.id, 'escalated')} className="flex-1 bg-rose-500/10 text-rose-400 font-sans text-[9px] uppercase tracking-widest py-1.5 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">Escalate</button>
                     )}
                     {col.id !== 'resolved' && (
                       <button onClick={() => updateStatus(dispute.id, 'resolved')} className="flex-1 bg-emerald-500/10 text-emerald-400 font-sans text-[9px] uppercase tracking-widest py-1.5 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Resolve</button>
                     )}
                   </div>
                </div>
              ))}

              {disputes.filter(d => d.status === col.id).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                  <p className="font-sans text-[10px] uppercase tracking-widest font-medium text-muted/20 text-center border border-dashed border-white/5 rounded-sm p-4 w-full">Drop Target</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
