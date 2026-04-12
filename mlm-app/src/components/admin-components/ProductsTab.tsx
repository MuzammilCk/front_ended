import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminUpdateListing } from "../../api/admin";
import type { AdminProductType, Listing } from "../../api/types";
import EditProductModal from "./EditProductModal";
import DeleteModal from "./DeleteModal";
import { useAdminData } from "../../context/AdminContext";

const PAGE_SIZE = 20;

export default function ProductsTab() {
  const navigate = useNavigate();
  const { products, rawListings, setProducts, refreshListings } = useAdminData();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Derive families from active products
  const FAMILIES = useMemo(() => Array.from(new Set(products.map((p) => p.family))).filter(Boolean), [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFamily = !familyFilter || p.family === familyFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? p.active : !p.active);
      const matchesStock = !stockFilter || (stockFilter === "low" && p.stock < 15);
      return matchesSearch && matchesFamily && matchesStatus && matchesStock;
    });
  }, [products, search, familyFilter, statusFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, familyFilter, statusFilter, stockFilter]);

  const handleToggleActive = async (product: AdminProductType) => {
    const newStatus = product.active ? "hidden" : "active";
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
    );
    try {
      await adminUpdateListing(product.id, { status: newStatus });
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: product.active } : p))
      );
    }
  };

  const openDelete = (p: AdminProductType) => {
    setDeleteId(p.id);
    setDeleteName(p.name);
  };

  const openEdit = (p: AdminProductType) => {
    const listing = rawListings.find(l => l.id === p.id);
    if (listing) setEditingListing(listing);
  };

  const inputCls = "h-9 bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-[11px] px-3 outline-none focus:border-[#c9a96e]/50 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted/25">
          {products.length} fragrances · {products.filter((p) => p.active).length} active
        </p>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="bg-[#c9a96e] text-[#080604] text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 hover:bg-[#e8c87a] transition-colors duration-300 font-light"
        >
          + Add Perfume
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/30" />
          <input
            className={`w-full pl-9 pr-4 ${inputCls}`}
            placeholder="Search fragrances..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)} className={inputCls}>
          <option value="" className="bg-[#130e08]">All Families</option>
          {FAMILIES.map((f) => (
            <option key={f} value={f} className="bg-[#130e08]">{f}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="" className="bg-[#130e08]">All Status</option>
          <option value="active" className="bg-[#130e08]">Active</option>
          <option value="hidden" className="bg-[#130e08]">Hidden</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={inputCls}>
          <option value="" className="bg-[#130e08]">All Stock</option>
          <option value="low" className="bg-[#130e08]">Low Stock (&lt;15)</option>
        </select>
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="grid grid-cols-7 py-3 px-5 border-b border-[#c9a96e]/5">
          {["Name", "Type", "Family", "Price", "Stock", "Status", "Actions"].map((h) => (
            <span key={h} className="text-[10px] tracking-[0.22em] uppercase text-muted/20">
              {h}
            </span>
          ))}
        </div>
        {paginated.length === 0 ? (
          <p className="text-muted/40 py-8 text-center text-sm">No products found.</p>
        ) : (
          paginated.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-7 py-4 px-5 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
            >
              <span className="font-serif text-lg font-light text-[#e8dcc8]">
                {p.name}
              </span>
              <span className="text-[11px] text-muted/40">{p.type}</span>
              <span className="text-[11px] text-muted/40">{p.family}</span>
              <span className="text-[11px] text-[#c9a96e]">INR {p.price}</span>
              <span className={`text-[11px] ${p.stock < 15 ? "text-rose-400" : "text-muted/50"}`}>
                {p.stock} {p.stock < 15 ? "⚠" : ""}
              </span>
              <span
                className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit border
                ${p.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted/30 border-white/10"}`}
              >
                {p.active ? "Active" : "Hidden"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(p)}
                  className={`w-9 h-5 rounded-full border relative transition-all duration-300 shrink-0
                    ${p.active ? "bg-[#c9a96e]/30 border-[#c9a96e]/60" : "bg-white/5 border-white/15"}`}
                >
                  <div
                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300
                    ${p.active ? "left-[18px] bg-[#c9a96e]" : "left-0.5 bg-muted/30"}`}
                  />
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="text-[10px] tracking-widest uppercase text-[#c9a96e]/40 hover:text-[#c9a96e] border border-transparent hover:border-[#c9a96e]/25 px-2 py-1 transition"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDelete(p)}
                  className="text-sm transition-colors duration-200 text-rose-400/30 hover:text-rose-400"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[11px] text-muted/40 pt-2">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-[#c9a96e]/15 hover:border-[#c9a96e]/50 disabled:opacity-30 disabled:hover:border-[#c9a96e]/15 transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-[#c9a96e]/15 hover:border-[#c9a96e]/50 disabled:opacity-30 disabled:hover:border-[#c9a96e]/15 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingListing && (
        <EditProductModal
           listing={editingListing}
           onClose={() => setEditingListing(null)}
           onSave={() => void refreshListings()}
        />
      )}

      {deleteId !== null && (
        <DeleteModal
          deleteId={deleteId}
          deleteName={deleteName}
          setDeleteId={setDeleteId}
          setProducts={setProducts}
        />
      )}
    </div>
  );
}
