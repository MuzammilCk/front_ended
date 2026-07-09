import React, { useState } from 'react';
import StatCard from './StatCard';
import { useAdminToast } from '../../hooks/useAdminToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListPayouts, adminApprovePayout, adminRejectPayout, adminGetUserLedger } from '../../api/admin';
import type { PayoutRequest, LedgerEntry } from '../../api/types';

// Mock Commission Rules for now, since we aren't rebuilding the logic engine yet
const MOCK_RULES = [
  { id: 'rul-1', name: 'Direct Sponsor Bonus', level: 1, percentage: 15.0, condition: 'Must have active monthly minimum purchase ($50)', active: true },
  { id: 'rul-2', name: 'Generation 2 Override', level: 2, percentage: 7.5, condition: 'Must have 3 active direct recruits', active: true },
  { id: 'rul-3', name: 'Generation 3 Override', level: 3, percentage: 3.0, condition: 'Achieve Gold rank ($5,000 group volume)', active: true },
];

const STATUS_STYLE: Record<string, string> = {
  requested: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  approved: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  batched: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  sent: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

export default function PayoutsTab() {
  const { addToast } = useAdminToast();
  const queryClient = useQueryClient();
  
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ledgerUser, setLedgerUser] = useState<string | null>(null);

  const { data: payoutsRes, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => adminListPayouts({ limit: 100 }),
  });

  const payouts = payoutsRes?.data || [];

  const { data: ledgerRes, isLoading: ledgerLoading } = useQuery({
    queryKey: ['admin-ledger', ledgerUser],
    queryFn: () => adminGetUserLedger(ledgerUser!, { limit: 50 }),
    enabled: !!ledgerUser,
  });

  const ledgerEntries = ledgerRes?.data || [];
  // Calculate a mock running total if we want, or rely on actual user balance if we fetch it.
  // For now, simple sum of settled entries:
  const availableBalance = ledgerEntries.reduce((sum, e) => sum + (e.status === 'settled' ? Number(e.amount) : 0), 0);

  // Compute stats dynamically
  const pendingPayouts = payouts.filter(p => p.status === 'requested');
  const thisMonthPayouts = payouts.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth());
  const rejectedPayouts = payouts.filter(p => p.status === 'rejected');
  const processedThisWeek = payouts.filter(p => p.status === 'sent' && new Date(p.created_at).getTime() > Date.now() - 7*24*60*60*1000);

  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalProcessedWeekAmount = processedThisWeek.reduce((sum, p) => sum + Number(p.amount), 0);

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApprovePayout(id),
    onSuccess: () => {
      addToast('Payout moved to Processing queue (Approved).', 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to approve payout', 'error');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminRejectPayout(id, reason),
    onSuccess: () => {
      addToast('Payout request rejected.', 'warning');
      setRejectId(null);
      setRejectReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to reject payout', 'error');
    }
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleApplyReject = (id: string) => {
    if (rejectReason.trim().length < 5) return addToast('Please provide a descriptive reason', 'error');
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";

  return (
    <div className="space-y-12 max-w-7xl animate-in fade-in duration-300">
      
      {/* 1. HEADER STATS ROW */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Pending Payouts" value={`₹ ${totalPendingAmount.toLocaleString()}`} color="gold" />
        <StatCard label="Payouts This Month" value={thisMonthPayouts.length.toString()} color="sky" trend={12.4} />
        <StatCard label="Rejected / Cancelled" value={rejectedPayouts.length.toString()} color="rose" />
        <StatCard label="Processed This Week" value={`₹ ${totalProcessedWeekAmount.toLocaleString()}`} color="emerald" trend={-4.1} />
      </div>

      {/* 2. PAYOUTS TABLE */}
      <div>
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-6">Pending Withdrawal Requests</p>
        
        <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] shadow-xl min-h-[300px]">
          <div className="grid grid-cols-5 py-4 px-6 border-b border-[#c9a96e]/10 bg-white/5">
            {['User Reference', 'Amount', 'Status Code', 'Requested At', 'Operations'].map(h => (
              <span key={h} className="admin-table-header">{h}</span>
            ))}
          </div>

          <div>
            {payoutsLoading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#c9a96e]/5 rounded-sm" />)}
              </div>
            ) : payouts.length === 0 ? (
              <div className="p-12 text-center text-muted/40 font-sans text-xs">No payout requests found.</div>
            ) : (
              payouts.map(p => (
                <div key={p.id}>
                  <div className={`grid grid-cols-5 py-4 px-6 items-center transition-colors ${rejectId === p.id ? 'bg-rose-500/5 border-b border-rose-500/20' : 'border-b border-[#c9a96e]/4 hover:bg-[#c9a96e]/5'}`}>
                    
                    {/* User Reference */}
                    <div>
                      <p className="font-sans text-sm font-medium text-[#e8dcc8] truncate pr-4" title={p.user_id}>{p.user_id.slice(0, 16)}...</p>
                      <button onClick={() => setLedgerUser(p.user_id)} className="font-sans text-[10px] text-[#c9a96e]/60 hover:text-[#c9a96e] hover:underline uppercase tracking-widest mt-1">
                        View Ledger →
                      </button>
                    </div>
                    
                    {/* Amount */}
                    <span className="font-serif text-lg tracking-wide text-[#c9a96e]">
                      {Number(p.amount).toLocaleString(undefined, { style: 'currency', currency: p.currency })}
                    </span>

                    {/* Status */}
                    <div>
                      <span className={`font-sans text-[9px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-sm ${STATUS_STYLE[p.status] || 'bg-white/5 text-white'}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                      {p.status === 'rejected' && p.rejection_reason && (
                        <p className="font-sans text-[10px] text-rose-400/60 mt-2 truncate w-48" title={p.rejection_reason}>Rejected: {p.rejection_reason}</p>
                      )}
                    </div>

                    {/* Requested At */}
                    <span className="font-sans text-[11px] text-muted/40 tabular-nums">
                      {new Date(p.created_at).toLocaleString()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {p.status === 'requested' && (
                        <>
                          <button onClick={() => handleApprove(p.id)} disabled={approveMutation.isPending} className="bg-sky-500/10 text-sky-400 font-sans text-[10px] uppercase font-medium tracking-widest px-3 py-2 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">Approve</button>
                          <button onClick={() => setRejectId(rejectId === p.id ? null : p.id)} className="text-rose-400 font-sans text-[10px] uppercase font-medium tracking-widest px-3 py-2 hover:bg-rose-500/10 transition-colors">Reject</button>
                        </>
                      )}
                      {(p.status === 'approved' || p.status === 'batched') && (
                        <span className="text-sky-400/50 font-sans text-[10px] uppercase tracking-widest px-2">Processing Flow Active</span>
                      )}
                    </div>

                  </div>

                  {/* Inline Reject Reason Input */}
                  {rejectId === p.id && (
                    <div className="col-span-5 bg-[#0A0705] border-b border-[#c9a96e]/10 p-6 animate-in slide-in-from-top-2">
                      <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-rose-400/60 mb-3">Reject Payout Request</p>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                           <input 
                             autoFocus
                             className={`${inputCls} border-rose-500/30 focus:border-rose-500/60`} 
                             placeholder="Required: Provide compliance or security reason for rejecting this payout..."
                             value={rejectReason}
                             onChange={e => setRejectReason(e.target.value)}
                           />
                        </div>
                        <button onClick={() => handleApplyReject(p.id)} disabled={rejectMutation.isPending} className="bg-rose-500/90 text-white px-6 py-2.5 font-sans font-medium text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-lg">
                          Confirm Rejection
                        </button>
                        <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="text-muted/40 hover:text-white px-4 font-sans text-[10px] uppercase tracking-widest transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. COMMISSION RULES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="font-serif text-2xl font-light text-[#e8dcc8]">Network Commission Rules</p>
          <button onClick={() => addToast('Configurator module locked pending authorization.', 'warning')} className="bg-white/5 border border-white/10 text-muted/40 px-4 py-2 font-sans font-medium text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
            Configure Logic Engine →
          </button>
        </div>

        <div className="border border-[#c9a96e]/10 bg-[#0d0a07] shadow-xl">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_2fr_1fr] py-4 px-6 border-b border-[#c9a96e]/10 bg-white/5">
            {['Rule Definition', 'Depth Level', 'Yield Percentage', 'Prerequisite Condition', 'Engine State'].map(h => (
              <span key={h} className="admin-table-header">{h}</span>
            ))}
          </div>

          <div>
             {MOCK_RULES.map(rule => (
                <div key={rule.id} className="grid grid-cols-[1.5fr_1fr_1fr_2fr_1fr] py-5 px-6 border-b border-[#c9a96e]/5 items-center hover:bg-[#c9a96e]/3 transition-colors">
                  <span className="font-sans text-xs text-[#e8dcc8] font-medium tracking-wide">{rule.name}</span>
                  <span className="font-serif text-lg text-white/50">Lvl {rule.level}</span>
                  <span className="font-serif text-xl tracking-tight text-[#c9a96e]">{rule.percentage}%</span>
                  <span className="font-sans text-[11px] text-muted/50 leading-relaxed pr-6">{rule.condition}</span>
                  <div>
                    <span className={`font-sans text-[9px] uppercase font-medium tracking-widest px-2.5 py-1 ${rule.active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-white/5 border border-white/10 text-muted/40'}`}>
                      {rule.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Ledger Drawer Fragment */}
      {ledgerUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-[#080604]/80 backdrop-blur-md" onClick={() => setLedgerUser(null)} />
          <div className="w-[500px] max-w-full bg-[#0d0a07] border-l border-[#c9a96e]/20 h-full relative ml-auto shadow-2xl p-8 flex flex-col animate-in slide-in-from-right-8 duration-300">
             
             <button onClick={() => setLedgerUser(null)} className="absolute top-8 right-8 text-muted/40 hover:text-rose-400 hover:scale-110 transition-transform">✕</button>
             
             <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-1">Entity Ledger</p>
             <p className="font-mono text-[10px] text-muted/30 mb-8 bg-white/5 px-2 py-1 w-fit border border-white/5 truncate" title={ledgerUser}>{ledgerUser}</p>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="grid grid-cols-[3fr_2fr] gap-4 mb-2 pb-2 border-b border-[#c9a96e]/10">
                   <span className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-[#c9a96e]/40">Event Reference</span>
                   <span className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-[#c9a96e]/40 text-right">Delta</span>
                </div>
                
                {ledgerLoading ? (
                  <div className="space-y-4 animate-pulse pt-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-[#c9a96e]/5 rounded-sm" />)}
                  </div>
                ) : ledgerEntries.length === 0 ? (
                  <div className="py-12 text-center text-muted/40 text-xs font-sans">No ledger entries found.</div>
                ) : (
                  ledgerEntries.map(trx => (
                    <div key={trx.id} className="grid grid-cols-[3fr_2fr] gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 transition-colors rounded-sm">
                      <div>
                        <p className="font-sans text-[11px] font-medium text-white/60 line-clamp-1">{trx.entry_type.replace('_', ' ')}</p>
                        <p className="font-sans text-[9px] text-muted/40 mt-1 tabular-nums">{new Date(trx.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex flex-col justify-center">
                         <span className={`font-serif text-lg tracking-tight ${Number(trx.amount) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {Number(trx.amount) > 0 ? '+' : ''}{Number(trx.amount).toLocaleString(undefined, { style: 'currency', currency: trx.currency })}
                         </span>
                         <span className="font-sans text-[8px] uppercase tracking-widest text-muted/50 mt-0.5">{trx.status}</span>
                      </div>
                    </div>
                  ))
                )}
             </div>
             
             <div className="pt-6 mt-6 border-t border-[#c9a96e]/20 flex justify-between items-center bg-[#c9a96e]/5 p-6 rounded-sm">
                <span className="font-sans text-xs uppercase tracking-widest text-[#c9a96e]/60 font-medium">Estimated Settled Balance</span>
                <span className="font-serif text-3xl text-[#c9a96e] tracking-tight">{availableBalance.toLocaleString(undefined, { style: 'currency', currency: ledgerEntries[0]?.currency || 'INR' })}</span>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
