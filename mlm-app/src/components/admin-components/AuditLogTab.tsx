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
    const entries = Object.entries(changes);
    if (entries.length === 0) return "—";
    return entries
      .slice(0, 3)
      .map(([key, { before, after }]) => `${key}: ${String(before)} → ${String(after)}`)
      .join(", ") + (entries.length > 3 ? `, +${entries.length - 3} more` : "");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted/25">
            Filter by entity:
          </label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-1.5 outline-none focus:border-[#c9a96e]/50"
          >
            <option value="" className="bg-[#130e08]">All</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t} className="bg-[#130e08]">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted/20">
          {total} total entries
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="px-6 py-4 border-b border-[#c9a96e]/5">
          <p className="font-serif text-xl font-light text-[#e8dcc8]">
            Audit Log
          </p>
        </div>

        <div className="grid grid-cols-5 py-2 px-6 border-b border-[#c9a96e]/5">
          {["Timestamp", "Actor", "Action", "Entity", "Changes"].map((h) => (
            <span
              key={h}
              className="text-[10px] tracking-[0.2em] uppercase text-muted/20"
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="animate-pulse flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-[#c9a96e]/5 rounded" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-muted/40 text-sm">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted/40 text-sm">
            No audit log entries found.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-5 py-3 px-6 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
            >
              <span className="text-[10px] text-muted/30">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span className="text-xs text-[#e8dcc8] font-light truncate">
                {log.actor}
              </span>
              <span className="text-xs text-[#c9a96e]">{log.action}</span>
              <span className="text-xs text-muted/50">
                {log.entity_type}/{log.entity_id.slice(-6)}
              </span>
              <span className="text-[10px] text-muted/30 truncate" title={formatChanges(log.changes)}>
                {formatChanges(log.changes)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-4 py-2 hover:bg-[#c9a96e]/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-muted/40">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-4 py-2 hover:bg-[#c9a96e]/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
