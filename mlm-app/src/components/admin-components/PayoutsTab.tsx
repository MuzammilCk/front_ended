import React, { useState } from 'react';
import StatCard from './StatCard';
import { useAdminToast } from '../../hooks/useAdminToast';

export type PayoutStatus = 'pending' | 'processing' | 'on_hold' | 'completed';

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: PayoutStatus;
  requested_at: string;
  hold_reason?: string;
}

interface CommissionRule {
  id: string;
  name: string;
  level: number;
  percentage: number;
  condition: string;
  active: boolean;
}

const MOCK_PAYOUTS: PayoutRequest[] = [
  { id: 'pay-001', user_id: 'usr-928x-33a', amount: 45000, status: 'pending', requested_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'pay-002', user_id: 'usr-109y-44b', amount: 12500, status: 'processing', requested_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'pay-003', user_id: 'usr-210z-55c', amount: 88000, status: 'on_hold', requested_at: new Date(Date.now() - 86400000 * 7).toISOString(), hold_reason: 'KYC missing for high-value transfer' },
  { id: 'pay-004', user_id: 'usr-321w-66d', amount: 3200, status: 'pending', requested_at: new Date(Date.now() - 3600000 * 5).toISOString() },
];

const MOCK_RULES: CommissionRule[] = [
  { id: 'rul-1', name: 'Direct Sponsor Bonus', level: 1, percentage: 15.0, condition: 'Must have active monthly minimum purchase ($50)', active: true },
  { id: 'rul-2', name: 'Generation 2 Override', level: 2, percentage: 7.5, condition: 'Must have 3 active direct recruits', active: true },
  { id: 'rul-3', name: 'Generation 3 Override', level: 3, percentage: 3.0, condition: 'Achieve Gold rank ($5,000 group volume)', active: true },
];

const STATUS_STYLE: Record<PayoutStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  processing: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  on_hold: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

// --- Mock Ledger API ---
const MOCK_LEDGER = [
  { id: 'trx-1', date: '2026-04-10T10:00:00Z', type: 'commission', amount: 4500, detail: 'Direct Sponsor Bonus from ord-992' },
  { id: 'trx-2', date: '2026-04-09T14:30:00Z', type: 'commission', amount: 1200, detail: 'Generation 2 Override from ord-881' },
  { id: 'trx-3', date: '2026-04-05T09:15:00Z', type: 'withdrawal', amount: -6800, detail: 'Bank Transfer requested (pay-992)' },
];

export default function PayoutsTab() {
  const { addToast } = useAdminToast();
  
  const [payouts, setPayouts] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [ledgerUser, setLedgerUser] = useState<string | null>(null);

  // TODO: Connect to /admin/payouts when backend implements
  const handleApprove = (id: string) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'processing' } : p));
    addToast('Payout moved to Processing queue. (Backend mock)', 'success');
  };

  const handleApplyHold = (id: string) => {
    if (holdReason.trim().length < 5) return addToast('Please provide a descriptive hold reason', 'error');
    
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'on_hold', hold_reason: holdReason } : p));
    setHoldId(null);
    setHoldReason('');
    addToast('Payout placed on administrative hold.', 'warning');
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";

  return (
    <div className="space-y-12 max-w-7xl animate-in fade-in duration-300">
      
      {/* 1. HEADER STATS ROW */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Pending Payouts" value="₹ 48,700" color="gold" />
        <StatCard label="Payouts This Month" value="142" color="sky" trend={12.4} />
        <StatCard label="Administrative Holds" value="3" color="rose" />
        <StatCard label="Processed This Week" value="₹ 290,000" color="emerald" trend={-4.1} />
      </div>

      {/* Warning Overlay */}
      <div className="border border-sky-500/20 bg-sky-500/5 px-6 py-4 font-sans font-medium tracking-wide text-xs text-sky-400 shadow-md">
        🛈 Endpoint mapped for frontend evaluation. Full `/admin/payouts` and `/admin/commission-rules` logic is scheduled for upcoming backend sprints.
      </div>

      {/* 2. PAYOUTS TABLE */}
      <div>
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-6">Pending Withdrawal Requests</p>
        
        <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] shadow-xl">
          <div className="grid grid-cols-5 py-4 px-6 border-b border-[#c9a96e]/10 bg-white/5">
            {['User Reference', 'Amount (INR)', 'Status Code', 'Requested At', 'Operations'].map(h => (
              <span key={h} className="admin-table-header">{h}</span>
            ))}
          </div>

          <div>
            {payouts.map(p => (
              <div key={p.id}>
                <div className={`grid grid-cols-5 py-4 px-6 items-center transition-colors ${holdId === p.id ? 'bg-rose-500/5 border-b border-rose-500/20' : 'border-b border-[#c9a96e]/4 hover:bg-[#c9a96e]/5'}`}>
                  
                  {/* User Reference */}
                  <div>
                    <p className="font-sans text-sm font-medium text-[#e8dcc8] truncate pr-4">{p.user_id}</p>
                    <button onClick={() => setLedgerUser(p.user_id)} className="font-sans text-[10px] text-[#c9a96e]/60 hover:text-[#c9a96e] hover:underline uppercase tracking-widest mt-1">
                      View Ledger →
                    </button>
                  </div>
                  
                  {/* Amount */}
                  <span className="font-serif text-lg tracking-wide text-[#c9a96e]">
                    ₹ {p.amount.toLocaleString()}
                  </span>

                  {/* Status */}
                  <div>
                    <span className={`font-sans text-[9px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-sm ${STATUS_STYLE[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                    {p.status === 'on_hold' && p.hold_reason && (
                      <p className="font-sans text-[10px] text-rose-400/60 mt-2 truncate w-48" title={p.hold_reason}>Hold: {p.hold_reason}</p>
                    )}
                  </div>

                  {/* Requested At */}
                  <span className="font-sans text-[11px] text-muted/40 tabular-nums">
                    {new Date(p.requested_at).toLocaleString()}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(p.id)} className="bg-sky-500/10 text-sky-400 font-sans text-[10px] uppercase font-medium tracking-widest px-3 py-2 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">Approve</button>
                        <button onClick={() => setHoldId(holdId === p.id ? null : p.id)} className="text-rose-400 font-sans text-[10px] uppercase font-medium tracking-widest px-3 py-2 hover:bg-rose-500/10 transition-colors">Hold</button>
                      </>
                    )}
                    {p.status === 'processing' && (
                      <span className="text-sky-400/50 font-sans text-[10px] uppercase tracking-widest px-2">Processing Flow Active</span>
                    )}
                  </div>

                </div>

                {/* Inline Hold Reason Input */}
                {holdId === p.id && (
                  <div className="col-span-5 bg-[#0A0705] border-b border-[#c9a96e]/10 p-6 animate-in slide-in-from-top-2">
                    <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-rose-400/60 mb-3">Place Administrative Hold</p>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                         <input 
                           autoFocus
                           className={`${inputCls} border-rose-500/30 focus:border-rose-500/60`} 
                           placeholder="Required: Provide compliance or security reason for suspending this payout..."
                           value={holdReason}
                           onChange={e => setHoldReason(e.target.value)}
                         />
                      </div>
                      <button onClick={() => handleApplyHold(p.id)} className="bg-rose-500/90 text-white px-6 py-2.5 font-sans font-medium text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-lg">
                        Confirm Suspension
                      </button>
                      <button onClick={() => { setHoldId(null); setHoldReason(''); }} className="text-muted/40 hover:text-white px-4 font-sans text-[10px] uppercase tracking-widest transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
          <div className="w-[500px] bg-[#0d0a07] border-l border-[#c9a96e]/20 h-full relative ml-auto shadow-2xl p-8 flex flex-col animate-in slide-in-from-right-8 duration-300">
             
             <button onClick={() => setLedgerUser(null)} className="absolute top-8 right-8 text-muted/40 hover:text-rose-400 hover:scale-110 transition-transform">✕</button>
             
             <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-1">Entity Ledger</p>
             <p className="font-mono text-[10px] text-muted/30 mb-8 bg-white/5 px-2 py-1 w-fit border border-white/5">{ledgerUser}</p>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="grid grid-cols-[3fr_2fr] gap-4 mb-2 pb-2 border-b border-[#c9a96e]/10">
                   <span className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-[#c9a96e]/40">Event Reference</span>
                   <span className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-[#c9a96e]/40 text-right">Delta</span>
                </div>
                
                {MOCK_LEDGER.map(trx => (
                  <div key={trx.id} className="grid grid-cols-[3fr_2fr] gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 transition-colors rounded-sm">
                    <div>
                      <p className="font-sans text-[11px] font-medium text-white/60 line-clamp-1">{trx.detail}</p>
                      <p className="font-sans text-[9px] text-muted/40 mt-1 tabular-nums">{new Date(trx.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                       <span className={`font-serif text-lg tracking-tight ${trx.amount >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                         {trx.amount > 0 ? '+' : ''}{trx.amount.toLocaleString()}
                       </span>
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="pt-6 mt-6 border-t border-[#c9a96e]/20 flex justify-between items-center bg-[#c9a96e]/5 p-6 rounded-sm">
                <span className="font-sans text-xs uppercase tracking-widest text-[#c9a96e]/60 font-medium">Available Balance</span>
                <span className="font-serif text-3xl text-[#c9a96e] tracking-tight">₹ 82,500</span>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
