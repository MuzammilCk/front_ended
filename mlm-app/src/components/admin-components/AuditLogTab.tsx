import { useEffect, useState } from "react";
import { getAuditLogs } from "../../api/admin";
import type { AuditLogEntry } from "../../api/types";

const ENTITY_TYPES = ["", "listing", "order", "user", "category", "inventory", "media"];

export default function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 3. Expandable state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getAuditLogs({
      page,
      limit,
      entity_type: entityFilter || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setLogs(result.data);
          setTotal(result.total);
          setExpandedLogId(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audit logs");
          setLogs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatChanges = (changes: Record<string, { before: unknown; after: unknown }>): string => {
    const entries = Object.entries(changes || {});
    if (entries.length === 0) return "—";
    return entries
      .slice(0, 3)
      .map(([key, { before, after }]) => `${key}: ${String(before)} → ${String(after)}`)
      .join(", ") + (entries.length > 3 ? `, +${entries.length - 3} more` : "");
  };

  // 4. CSV Export
  const handleExportCSV = () => {
    const rows = logs.map(l => [
      l.timestamp, 
      l.actor, 
      l.action, 
      l.entity_type, 
      l.entity_id,
      `"${JSON.stringify(l.changes).replace(/"/g, '""')}"`
    ].join(','));
    
    const csv = ['Timestamp,Actor,Action,Entity Type,Entity ID,Changes Snapshot', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `audit-log-export-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBeforeAfterMaps = (changes: Record<string, { before: unknown; after: unknown }>) => {
    const beforeObj: Record<string, unknown> = {};
    const afterObj: Record<string, unknown> = {};
    Object.entries(changes || {}).forEach(([key, val]) => {
      beforeObj[key] = val.before;
      afterObj[key] = val.after;
    });
    return { beforeObj, afterObj };
  };

  return (
    <div className="space-y-6">
      {/* Filters & Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-[10px] tracking-[0.2em] font-sans uppercase text-muted/40 font-medium">
            Filter by entity:
          </label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-1.5 outline-none focus:border-[#c9a96e]/50 font-sans"
          >
            <option value="" className="bg-[#130e08]">All Events</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t} className="bg-[#130e08]">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          {/* 4. Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0 || loading}
            className="ml-2 bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] px-4 py-1.5 text-[10px] font-sans uppercase tracking-widest hover:bg-[#c9a96e]/20 disabled:opacity-30 disabled:hover:bg-[#c9a96e]/10 transition-colors rounded-sm"
          >
             Export CSV
          </button>
        </div>
        <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-muted/30 font-medium">
          {total} total entries
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] shadow-lg">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5">
          <p className="font-serif text-xl font-light text-[#e8dcc8] tracking-wide">
            System Audit Log
          </p>
        </div>

        <div className="grid grid-cols-5 py-3 px-6 border-b border-[#c9a96e]/5">
          {["Timestamp", "Actor", "Action", "Target Entity", "Delta Snapshot"].map((h) => (
            <span
              key={h}
              className="admin-table-header"
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          // 2. SKELETON LOADER
          <div className="w-full">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="grid grid-cols-5 py-5 px-6 border-b border-[#c9a96e]/4 animate-pulse gap-4">
                <div className="h-3 w-28 bg-[#c9a96e]/8 rounded-sm" />
                <div className="h-3 w-20 bg-[#c9a96e]/8 rounded-sm" />
                <div className="h-3 w-16 bg-[#c9a96e]/8 rounded-sm" />
                <div className="h-3 w-24 bg-[#c9a96e]/8 rounded-sm" />
                <div className="h-3 w-32 bg-[#c9a96e]/8 rounded-sm" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-rose-400/60 font-sans text-sm tracking-wide">
            ⚠ {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/40 font-sans text-sm tracking-wide">
            No audit log entries matched the parameters.
          </div>
        ) : (
          logs.map((log) => {
            const { beforeObj, afterObj } = getBeforeAfterMaps(log.changes);
            const isClickable = Object.keys(log.changes || {}).length > 0;
            
            return (
              <div key={log.id} className="group">
                <div
                  onClick={() => isClickable && setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className={`grid grid-cols-5 py-4 px-6 items-center transition-colors
                    ${expandedLogId === log.id ? 'bg-[#c9a96e]/5 border-b border-[#c9a96e]/20' : 'border-b border-[#c9a96e]/4 hover:bg-[#c9a96e]/3'}
                    ${isClickable ? 'cursor-pointer' : ''}
                  `}
                >
                  <span className="font-sans text-[11px] text-muted/40 tabular-nums">
                    {new Date(log.timestamp).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                  
                  <span className="font-sans text-xs text-white/70 truncate pr-4">
                    {log.actor}
                  </span>
                  
                  <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-[#c9a96e]">
                    {log.action}
                  </span>
                  
                  <span className="font-sans text-xs font-mono text-muted/50 tracking-tight">
                    {log.entity_type} <span className="text-muted/30">/</span> {log.entity_id.slice(-8)}
                  </span>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans text-xs text-white/40 truncate w-full" title={formatChanges(log.changes)}>
                      {formatChanges(log.changes)}
                    </span>
                    {isClickable && (
                      <span className="text-[9px] uppercase font-sans tracking-widest text-[#c9a96e]/40 group-hover:text-[#c9a96e]/80 transition-colors">
                        {expandedLogId === log.id ? 'Less' : 'More'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. EXPANDABLE DIFF VIEW */}
                {expandedLogId === log.id && (
                  <div className="grid grid-cols-5 col-span-5 px-6 py-6 bg-[#000000]/60 border-b border-[#c9a96e]/10 animate-in slide-in-from-top-1 fade-in duration-200 shadow-[inset_0_4px_6px_rgba(0,0,0,0.2)]">
                    <div className="col-span-5 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#130e08]/80 border border-white/5 p-4 rounded-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/40" />
                          <p className="font-sans text-[9px] uppercase font-medium tracking-widest text-rose-400/60 mb-3 ml-2">Previous State</p>
                          <pre className="text-white/50 text-[11px] whitespace-pre-wrap overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-white/10 ml-2 font-mono leading-loose tracking-tight">
                            {JSON.stringify(beforeObj, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-[#130e08]/80 border border-white/5 p-4 rounded-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                          <p className="font-sans text-[9px] uppercase font-medium tracking-widest text-emerald-400/60 mb-3 ml-2">Committed Change</p>
                          <pre className="text-white/70 text-[11px] whitespace-pre-wrap overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-white/10 ml-2 font-mono leading-loose tracking-tight">
                            {JSON.stringify(afterObj, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="font-sans text-[11px] text-muted/40 font-medium tracking-wide">
             Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} traces
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="font-sans font-medium text-[10px] tracking-widest uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-5 py-2 hover:bg-[#c9a96e]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
            >
              ← Previous
            </button>
            <span className="font-sans font-medium text-[10px] text-muted/40 uppercase tracking-widest px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="font-sans font-medium text-[10px] tracking-widest uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-5 py-2 hover:bg-[#c9a96e]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
            >
              Next Trace →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
