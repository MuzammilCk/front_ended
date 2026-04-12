import { useState, useEffect } from 'react';
import { adminApplyGraphCorrection, adminListGraphCorrections } from '../../api/admin';

export default function NetworkTab() {
  const [userId, setUserId] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    adminListGraphCorrections().then(res => setLogs(Array.isArray(res) ? res : (res as any).data || [])).catch(console.error);
  }, []);

  const handleApply = async () => {
    if (reason.length < 10) return setError('Reason must be at least 10 chars.');
    setLoading(true); setError(''); setSuccess('');
    try {
      const log = await adminApplyGraphCorrection({ userId, newSponsorId: sponsorId, reason });
      setSuccess('Graph correction applied.');
      setLogs([log, ...logs]);
      setUserId(''); setSponsorId(''); setReason('');
    } catch {
      setError('Correction failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full mb-4";

  return (
    <div className="flex gap-8 items-start">
      <div className="w-96 border border-[#c9a96e]/10 p-8 bg-[#0d0a07] shrink-0 sticky top-6 shadow-2xl">
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Graph Correction</p>
        <p className="text-[10px] uppercase tracking-widest text-muted/30 mb-8">Override MLM sponsor hierarchy</p>
        
        {error && <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 mb-6">⚠ {error}</div>}
        {success && <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 mb-6">{success}</div>}
        
        <label className="block text-[9px] uppercase tracking-widest text-muted/30 mb-1.5">User ID</label>
        <input className={inputCls} placeholder="User UUID..." value={userId} onChange={e => setUserId(e.target.value)} />
        
        <label className="block text-[9px] uppercase tracking-widest text-muted/30 mb-1.5">New Sponsor ID</label>
        <input className={inputCls} placeholder="Sponsor UUID..." value={sponsorId} onChange={e => setSponsorId(e.target.value)} />
        
        <label className="block text-[9px] uppercase tracking-widest text-muted/30 mb-1.5">Reason (Required)</label>
        <textarea className={`${inputCls} min-h-[80px]`} placeholder="Detailed explanation..." value={reason} onChange={e => setReason(e.target.value)} />
        
        <button 
          onClick={() => void handleApply()}
          disabled={loading}
          className="w-full mt-4 bg-[#c9a96e] text-[#080604] px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-light hover:bg-[#e8c87a] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Applying...' : 'Apply Correction'}
        </button>
      </div>

      <div className="flex-1 border border-[#c9a96e]/10 bg-[#0d0a07] p-8">
        <p className="font-serif text-xl font-light text-[#e8dcc8] mb-6">Correction History</p>
        <div className="space-y-6">
           {logs.map((log, i) => (
             <div key={i} className="border-b border-[#c9a96e]/5 pb-5">
               <p className="text-[#c9a96e] text-[10px] uppercase tracking-widest mb-2">{new Date(log.created_at || Date.now()).toLocaleString()}</p>
               <p className="text-sm font-light text-[#e8dcc8]">
                 Moved user <span className="font-mono text-xs bg-white/5 px-1 py-0.5 mx-1">{log.user_id?.slice(-6) || log.userId?.slice(-6) || 'Unknown'}</span> 
                 to sponsor <span className="font-mono text-xs bg-white/5 px-1 py-0.5 mx-1">{log.new_sponsor_id?.slice(-6) || log.newSponsorId?.slice(-6) || 'None'}</span>
               </p>
               <p className="text-[11px] text-muted/40 mt-1.5 bg-[#080604] p-2 border border-white/5 inline-block">Reason: {log.reason}</p>
             </div>
           ))}
           {logs.length === 0 && <p className="text-muted/30 text-xs">No corrections found in the audit log.</p>}
        </div>
      </div>
    </div>
  );
}
