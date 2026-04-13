import { useState, useEffect } from 'react';
import { adminApplyGraphCorrection, adminListGraphCorrections } from '../../api/admin';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function NetworkTab() {
  const [userId, setUserId] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ userId?: string, sponsorId?: string, reason?: string }>({});
  const [success, setSuccess] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['graph-corrections', page],
    queryFn: () => adminListGraphCorrections({ page, limit }),
  });

  const logs = Array.isArray(data) ? data : (data as any)?.data || [];
  // Fallback total counting if API returns raw array vs paginated shape
  const total = Array.isArray(data) ? data.length : (data as any)?.total || logs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    let timeout: any;
    if (success) timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleApply = async () => {
    // Exact strict parsing
    const errs: { userId?: string, sponsorId?: string, reason?: string } = {};
    if (!uuidRegex.test(userId.trim())) errs.userId = 'Invalid format. Must be a valid UUID.';
    if (!uuidRegex.test(sponsorId.trim())) errs.sponsorId = 'Invalid format. Must be a valid UUID.';
    if (reason.trim().length < 10) errs.reason = 'Reason must be at least 10 characters.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});

    const confirmation = window.prompt(
      `You are moving user ${userId.slice(0,8)} to sponsor ${sponsorId.slice(0,8)}.\nThis action is PERMANENT.\n\nType CONFIRM to proceed:`
    );
    
    if (confirmation !== 'CONFIRM') {
       return;
    }

    setLoading(true); setFormError(''); setSuccess('');
    try {
      await adminApplyGraphCorrection({ userId, newSponsorId: sponsorId, reason });
      setSuccess('Graph correction sequence successfully applied.');
      setUserId(''); setSponsorId(''); setReason('');
      void queryClient.invalidateQueries({ queryKey: ['graph-corrections'] });
      // Reset back to page 1 to see the new record if they were browsing history
      setPage(1);
    } catch {
      setFormError('Correction execution failed from the server block.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-3 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";
  const labelCls = "admin-label";

  return (
    <div className="flex gap-8 items-start">
      <div className="w-[420px] border border-[#c9a96e]/10 p-8 bg-[#0d0a07] shrink-0 sticky top-6 shadow-2xl">
        <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-1 tracking-tight">Graph Override</p>
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-amber-400/40 mb-8">Danger Zone: Direct Hierarchy Manipulation</p>
        
        {formError && <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 mb-6 font-sans font-medium tracking-wide">⚠ {formError}</div>}
        {success && <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 mb-6 font-sans font-medium tracking-wide">✓ {success}</div>}
        
        <div className="space-y-1">
          <label className={labelCls}>User ID Target</label>
          <input className={`${inputCls} ${fieldErrors.userId ? 'border-rose-500/40' : ''}`} placeholder="User UUID..." value={userId} onChange={e => setUserId(e.target.value)} />
          {fieldErrors.userId && <p className="text-rose-400 text-[10px] font-sans font-medium mt-1.5">{fieldErrors.userId}</p>}
        </div>
        
        <div className="space-y-1">
          <label className={labelCls}>New Sponsor ID Allocation</label>
          <input className={`${inputCls} ${fieldErrors.sponsorId ? 'border-amber-500/40' : ''}`} placeholder="Sponsor UUID..." value={sponsorId} onChange={e => setSponsorId(e.target.value)} />
          {fieldErrors.sponsorId && <p className="text-amber-400 text-[10px] font-sans font-medium mt-1.5">{fieldErrors.sponsorId}</p>}
        </div>
        
        <div className="space-y-1 mb-8">
          <label className={labelCls}>Correction Manifest (Required)</label>
          <textarea className={`${inputCls} min-h-[100px] resize-none ${fieldErrors.reason ? 'border-rose-500/40' : ''}`} placeholder="Provide an explicit functional reason for this hierarchy branch switch..." value={reason} onChange={e => setReason(e.target.value)} />
          {fieldErrors.reason && <p className="text-rose-400 text-[10px] font-sans font-medium mt-1.5">{fieldErrors.reason}</p>}
        </div>
        
        <button 
          onClick={() => void handleApply()}
          disabled={loading || !userId || !sponsorId || !reason}
          className="w-full bg-[#c9a96e] text-[#080604] px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#e8c87a] disabled:opacity-30 disabled:hover:bg-[#c9a96e] transition-all flex items-center justify-center gap-3 rounded-sm"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Processing Shift...
            </>
          ) : 'Execute Override'}
        </button>
      </div>

      <div className="flex-1 border border-[#c9a96e]/10 bg-[#0d0a07] p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8 border-b border-[#c9a96e]/5 pb-5">
          <p className="font-serif text-2xl font-light text-[#e8dcc8]">Network Correction Log</p>
          <p className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-muted/30">{total} documented alterations</p>
        </div>
        
        <div className="space-y-6">
           {isLoading ? (
             <div className="flex flex-col gap-6 animate-pulse">
               {[1,2,3,4].map(idx => (
                  <div key={idx} className="border-b border-[#c9a96e]/4 pb-6">
                    <div className="h-3 w-32 bg-[#c9a96e]/10 rounded-sm mb-4" />
                    <div className="h-4 w-96 bg-[#c9a96e]/10 rounded-sm mb-3" />
                    <div className="h-10 w-full max-w-xl bg-white/5 border border-white/5 rounded-sm" />
                  </div>
               ))}
             </div>
           ) : logs.length === 0 ? (
              <p className="text-muted/40 font-sans text-sm tracking-wide py-8">No structural network deviations found in the audit log.</p>
           ) : (
             logs.map((log: any, i: number) => (
               <div key={i} className="border-b border-[#c9a96e]/5 pb-6 last:border-0 hover:bg-[#c9a96e]/3 transition-colors p-4 -mx-4 rounded-sm">
                 <p className="text-[#c9a96e]/60 font-sans font-medium text-[10px] uppercase tracking-widest mb-3 tabular-nums">
                   {new Date(log.created_at || Date.now()).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                 </p>
                 <p className="text-sm font-sans font-medium tracking-wide text-white/70">
                   Reallocated node <span className="font-mono text-xs bg-rose-500/10 text-rose-300 px-2 py-1 mx-1.5 rounded-sm border border-rose-500/10">{log.user_id?.slice(-8) || log.userId?.slice(-8) || 'Unknown'}</span> 
                   into cluster <span className="font-mono text-xs bg-emerald-500/10 text-emerald-300 px-2 py-1 mx-1.5 rounded-sm border border-emerald-500/10">{log.new_sponsor_id?.slice(-8) || log.newSponsorId?.slice(-8) || 'Root'}</span>
                 </p>
                 <div className="mt-4 bg-[#0A0705] p-4 border-l-2 border-l-[#c9a96e] border border-white/5 rounded-r-sm inline-block w-full max-w-2xl">
                   <p className="font-sans text-[11px] text-[#e8dcc8]/80 leading-relaxed tracking-wide">
                     <span className="font-medium text-[#c9a96e] mr-2">AUTHORIZATION LOG:</span>
                     {log.reason}
                   </p>
                 </div>
               </div>
             ))
           )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-8 border-t border-[#c9a96e]/5 mt-4">
            <span className="font-sans text-[11px] text-muted/40 font-medium tracking-wide">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} entries
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="font-sans font-medium text-[10px] tracking-widest uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-5 py-2 hover:bg-[#c9a96e]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
              >
                ← Prev
              </button>
              <span className="font-sans font-medium text-[10px] text-muted/40 uppercase tracking-widest px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="font-sans font-medium text-[10px] tracking-widest uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-5 py-2 hover:bg-[#c9a96e]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
