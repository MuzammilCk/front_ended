import { useState, useEffect } from 'react';
import { adminApplyGraphCorrection, adminListGraphCorrections, adminGetDownline, adminGetNetworkNode, adminGetUserQualification } from '../../api/admin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronRight, ChevronDown, Network, ShieldAlert, Award } from 'lucide-react';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Network Node Component ---
function TreeNode({ node, level, onExpand, expandedNodes }: { node: any, level: number, onExpand: (id: string) => void, expandedNodes: Set<string> }) {
  const isExpanded = expandedNodes.has(node.userId);
  const hasChildren = node.directCount > 0;

  const { data: qualData } = useQuery({
    queryKey: ['admin-qual', node.userId],
    queryFn: () => adminGetUserQualification(node.userId),
    staleTime: 60000,
  });

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-3 py-2 px-3 border-b border-[#c9a96e]/5 hover:bg-[#c9a96e]/5 transition-colors group ${level === 0 ? 'bg-white/5' : ''}`}
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        <button 
          onClick={() => hasChildren && onExpand(node.userId)}
          className={`w-5 h-5 flex items-center justify-center rounded-sm transition-colors ${hasChildren ? 'hover:bg-white/10 cursor-pointer text-[#c9a96e]' : 'opacity-0 cursor-default'}`}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>
        
        <div className="flex-1 flex items-center gap-4">
          <div className="flex flex-col">
             <span className="font-mono text-sm text-[#e8dcc8]" title={node.userId}>{node.userId.slice(0,8)}...</span>
             <span className="font-sans text-[9px] uppercase tracking-widest text-muted/40">Lvl {node.depth}</span>
          </div>

          {qualData && (
            <div className="flex items-center gap-3 ml-4">
               <span className={`font-sans text-[9px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-sm ${qualData.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} border`}>
                 {qualData.isActive ? 'Active' : 'Inactive'}
               </span>
               <span className={`font-sans text-[9px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-sm ${qualData.isQualified ? 'bg-[#c9a96e]/10 border-[#c9a96e]/20 text-[#c9a96e]' : 'bg-white/5 border-white/10 text-muted/40'} border flex items-center gap-1`}>
                 <Award size={10} /> {qualData.isQualified ? 'Qualified' : 'Unqualified'}
               </span>
               <span className="font-serif text-sm text-white/60 tracking-tight ml-2">PV: {qualData.personalVolume}</span>
            </div>
          )}
        </div>

        <div className="text-right">
           <span className="font-sans text-[10px] text-muted/40 uppercase tracking-widest block">Directs: <span className="text-[#c9a96e] font-mono">{node.directCount}</span></span>
        </div>
      </div>
      
      {isExpanded && node.children && (
        <div className="flex flex-col border-l border-[#c9a96e]/10 ml-5">
           {node.children.map((child: any) => (
             <TreeNode key={child.userId} node={child} level={level + 1} onExpand={onExpand} expandedNodes={expandedNodes} />
           ))}
        </div>
      )}
    </div>
  );
}

// --- Main Tab Component ---
export default function NetworkTab() {
  const [activeSubTab, setActiveSubTab] = useState<'tree' | 'override'>('tree');

  // Override Form State
  const [userIdTarget, setUserIdTarget] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ userId?: string, sponsorId?: string, reason?: string }>({});
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Tree State
  const [searchTarget, setSearchTarget] = useState('');
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<any>(null); // In-memory tree structure

  const queryClient = useQueryClient();

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['graph-corrections', page],
    queryFn: () => adminListGraphCorrections({ page, limit }),
    enabled: activeSubTab === 'override',
  });

  const logs = Array.isArray(logsData) ? logsData : (logsData as any)?.data || [];
  const total = Array.isArray(logsData) ? logsData.length : (logsData as any)?.total || logs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    let timeout: any;
    if (success) timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleApplyOverride = async () => {
    const errs: { userId?: string, sponsorId?: string, reason?: string } = {};
    if (!uuidRegex.test(userIdTarget.trim())) errs.userId = 'Invalid format. Must be a valid UUID.';
    if (!uuidRegex.test(sponsorId.trim())) errs.sponsorId = 'Invalid format. Must be a valid UUID.';
    if (reason.trim().length < 10) errs.reason = 'Reason must be at least 10 characters.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});

    const confirmation = window.prompt(
      `You are moving user ${userIdTarget.slice(0,8)} to sponsor ${sponsorId.slice(0,8)}.\nThis action is PERMANENT.\n\nType CONFIRM to proceed:`
    );
    
    if (confirmation !== 'CONFIRM') return;

    setLoading(true); setFormError(''); setSuccess('');
    try {
      await adminApplyGraphCorrection({ userId: userIdTarget, newSponsorId: sponsorId, reason });
      setSuccess('Graph correction sequence successfully applied.');
      setUserIdTarget(''); setSponsorId(''); setReason('');
      void queryClient.invalidateQueries({ queryKey: ['graph-corrections'] });
      setPage(1);
    } catch {
      setFormError('Correction execution failed from the server block.');
    } finally {
      setLoading(false);
    }
  };

  const loadTreeRoot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuidRegex.test(searchTarget.trim())) return alert("Invalid UUID format");
    
    setActiveRootId(searchTarget.trim());
    setExpandedNodes(new Set());
    setTreeData(null);

    try {
      const res = await adminGetDownline(searchTarget.trim(), { maxDepth: 1, limit: 100 });
      // Build tree
      const rootNode = { ...res.rootNode, children: [] as any[] };
      // Map children
      res.data.forEach(child => {
        if (child.sponsorId === rootNode.userId) {
          rootNode.children.push({ ...child, children: [] });
        }
      });
      setTreeData(rootNode);
      setExpandedNodes(new Set([rootNode.userId]));
    } catch (err: any) {
      alert(err.message || 'Failed to load user node');
    }
  };

  const handleExpandNode = async (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
      setExpandedNodes(newExpanded);
      return;
    }

    // Expand
    newExpanded.add(nodeId);
    setExpandedNodes(newExpanded);

    // Fetch children if we don't have them in treeData yet
    // Recursive function to find the node and attach children
    const attachChildren = (node: any, targetId: string, childrenData: any[]): boolean => {
      if (node.userId === targetId) {
        if (!node.children || node.children.length === 0) {
           node.children = childrenData.filter(c => c.sponsorId === targetId).map(c => ({...c, children: []}));
        }
        return true;
      }
      if (node.children) {
        for (let child of node.children) {
          if (attachChildren(child, targetId, childrenData)) return true;
        }
      }
      return false;
    };

    try {
      const res = await adminGetDownline(nodeId, { maxDepth: 1, limit: 100 });
      const newData = JSON.parse(JSON.stringify(treeData)); // dirty deep clone
      attachChildren(newData, nodeId, res.data);
      setTreeData(newData);
    } catch (err) {
      console.error(err);
    }
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-3 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";
  const labelCls = "admin-label";

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-serif text-3xl font-light text-[#e8dcc8]">Network Operations</h1>
          <p className="font-sans text-xs text-white/40 mt-1">Visualize hierarchy and execute structural overrides</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#c9a96e]/10 pb-4">
        <button
          onClick={() => setActiveSubTab('tree')}
          className={`font-sans text-[11px] uppercase tracking-widest font-medium px-5 py-2.5 transition-colors rounded-sm flex items-center gap-2 ${activeSubTab === 'tree' ? 'bg-[#c9a96e] text-black shadow-[0_0_15px_rgba(201,169,110,0.15)]' : 'bg-white/5 border border-white/5 text-muted/40 hover:bg-white/10 hover:text-white'}`}
        >
          <Network size={14} /> Global Explorer
        </button>
        <button
          onClick={() => setActiveSubTab('override')}
          className={`font-sans text-[11px] uppercase tracking-widest font-medium px-5 py-2.5 transition-colors rounded-sm flex items-center gap-2 ${activeSubTab === 'override' ? 'bg-[#c9a96e] text-black shadow-[0_0_15px_rgba(201,169,110,0.15)]' : 'bg-white/5 border border-white/5 text-muted/40 hover:bg-white/10 hover:text-white'}`}
        >
           <ShieldAlert size={14} /> Structural Overrides
        </button>
      </div>

      {activeSubTab === 'tree' && (
        <div className="border border-[#c9a96e]/10 bg-[#0d0a07] shadow-xl min-h-[600px] flex flex-col">
           <div className="p-6 border-b border-[#c9a96e]/10 bg-white/5 flex gap-4 items-center">
             <form onSubmit={loadTreeRoot} className="flex-1 max-w-lg relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Enter Root User UUID to build tree..." 
                  value={searchTarget}
                  onChange={e => setSearchTarget(e.target.value)}
                  className="w-full bg-[#0A0705] border border-[#c9a96e]/20 text-[#e8dcc8] text-xs font-mono py-3 pl-10 pr-4 focus:border-[#c9a96e]/50 outline-none rounded-sm transition-colors"
                />
             </form>
             <button onClick={loadTreeRoot} className="bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/20 px-6 py-3 font-sans text-[10px] uppercase tracking-widest font-medium rounded-sm transition-colors">
               Render Subtree
             </button>
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto">
             {!treeData ? (
               <div className="h-full flex flex-col items-center justify-center text-muted/30">
                  <Network className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-serif text-xl text-[#e8dcc8]/40">No Reference Node Loaded</p>
                  <p className="font-sans text-xs mt-2 uppercase tracking-widest">Execute a query to visualize the downline graph</p>
               </div>
             ) : (
                <div className="bg-[#0A0705] border border-[#c9a96e]/5 pb-4">
                  <TreeNode node={treeData} level={0} onExpand={handleExpandNode} expandedNodes={expandedNodes} />
                </div>
             )}
           </div>
        </div>
      )}

      {activeSubTab === 'override' && (
        <div className="flex gap-8 items-start animate-in slide-in-from-right-4 duration-300">
          <div className="w-[420px] border border-[#c9a96e]/10 p-8 bg-[#0d0a07] shrink-0 sticky top-6 shadow-2xl">
            <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1 tracking-tight">Injection Controller</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-amber-400/40 mb-8">Danger Zone: Direct Hierarchy Manipulation</p>
            
            {formError && <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400 mb-6 font-sans font-medium tracking-wide">⚠ {formError}</div>}
            {success && <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 mb-6 font-sans font-medium tracking-wide">✓ {success}</div>}
            
            <div className="space-y-1">
              <label className={labelCls}>User ID Target</label>
              <input className={`${inputCls} ${fieldErrors.userId ? 'border-rose-500/40' : ''}`} placeholder="User UUID..." value={userIdTarget} onChange={e => setUserIdTarget(e.target.value)} />
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
              onClick={() => void handleApplyOverride()}
              disabled={loading || !userIdTarget || !sponsorId || !reason}
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
              <p className="font-serif text-2xl font-light text-[#e8dcc8]">Execution Log</p>
              <p className="font-sans text-[10px] uppercase font-medium tracking-[0.2em] text-muted/30">{total} documented alterations</p>
            </div>
            
            <div className="space-y-6">
               {logsLoading ? (
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
                       {new Date(log.created_at || Date.now()).toLocaleString()}
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
      )}
    </div>
  );
}
