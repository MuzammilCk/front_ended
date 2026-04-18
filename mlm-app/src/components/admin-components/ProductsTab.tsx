import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminUpdateListing, adminGetListings } from "../../api/admin";
import { apiRequest } from "../../api/client";
import type { AdminProductType, Listing } from "../../api/types";
import EditProductModal from "./EditProductModal";
import DeleteModal from "./DeleteModal";
import { useAdminData } from "../../context/AdminContext";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

const PAGE_SIZE = 20;

export default function ProductsTab() {
  const navigate = useNavigate();
  // 1. DATA FROM CONTEXT + URL NAVIGATION
  const { products, rawListings, setProducts, refreshListings } = useAdminData();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [serverPage, setServerPage] = useState(1);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const FAMILIES = useMemo(() => Array.from(new Set(products.map((p) => p.family))).filter(Boolean), [products]);

  useEffect(() => {
    setServerPage(1);
    setRowSelection({});
  }, [search, familyFilter, statusFilter, stockFilter]);

  // 2. SERVER-SIDE PAGINATION
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-listings', serverPage, statusFilter, familyFilter, search, stockFilter],
    queryFn: () => adminGetListings({
      limit: PAGE_SIZE,
      page: serverPage,
      status: statusFilter || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const tableData: AdminProductType[] = useMemo(() => {
    if (!data?.data) return [];
    let mapped = data.data.map((l: Listing) => ({
      id: l.id,
      name: l.title,
      type: l.category?.name ?? "Parfum",
      family: l.category?.name ?? "General",
      price: parseFloat(l.price),
      stock: l.inventory_item?.available_qty ?? l.quantity ?? 0,
      active: l.status === "active",
    }));

    if (search) mapped = mapped.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    if (familyFilter) mapped = mapped.filter(m => m.family === familyFilter);
    if (stockFilter === "low") mapped = mapped.filter(m => m.stock < 15);

    return mapped;
  }, [data, search, familyFilter, stockFilter]);

  const totalFilteredCount = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE));

  const handleToggleActive = async (product: AdminProductType) => {
    const newStatus = product.active ? "paused" : "active";
    // Quick local optimistic update
    
    try {
      await adminUpdateListing(product.id, { status: newStatus });
      void refetch();
      void refreshListings();
    } catch {
      console.error("Failed to toggle listing status");
    }
  };

  const openDelete = (p: AdminProductType) => {
    setDeleteId(p.id);
    setDeleteName(p.name);
  };

  const openEdit = (p: AdminProductType) => {
    const listing = rawListings.find(l => l.id === p.id) || data?.data.find(l => l.id === p.id);
    if (listing) setEditingListing(listing);
  };

  // 3. TANSTACK TABLE SETUP
  const columnHelper = createColumnHelper<AdminProductType>();

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="accent-[#c9a96e] scale-110"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="accent-[#c9a96e] scale-110"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Product',
      cell: info => <span className="font-serif text-lg font-light text-[#e8dcc8] whitespace-nowrap">{info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => <span className="font-sans text-xs text-muted/50">{info.getValue()}</span>,
      enableSorting: false,
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: info => <span className="font-sans text-xs text-[#c9a96e]">INR {info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('stock', {
      header: 'Stock',
      cell: info => (
        <span className={`font-sans text-xs ${info.getValue() < 15 ? 'text-rose-400' : 'text-muted/50'}`}>
          {info.getValue()} {info.getValue() < 15 ? '⚠' : ''}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('active', {
      header: 'Status',
      cell: info => (
        <span className={`font-sans text-[10px] tracking-wide uppercase px-2 py-0.5 border rounded-sm
          ${info.getValue()
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-white/5 text-muted/50 border-white/10'
          }`}>
          {info.getValue() ? 'Active' : 'Hidden'}
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleToggleActive(row.original)}
            className={`w-9 h-5 rounded-full border relative transition-all duration-300 shrink-0
              ${row.original.active ? "bg-[#c9a96e]/30 border-[#c9a96e]/60" : "bg-white/5 border-white/15"}`}
          >
            <div
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300
              ${row.original.active ? "left-[18px] bg-[#c9a96e]" : "left-0.5 bg-muted/30"}`}
            />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            className="font-sans font-medium text-[10px] tracking-widest uppercase text-[#c9a96e]/40 hover:text-[#c9a96e] border border-transparent hover:border-[#c9a96e]/25 px-2 py-1 transition"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={() => openDelete(row.original)}
            className="text-sm transition-colors duration-200 text-rose-400/30 hover:text-rose-400"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ),
    })
  ], []); // Keeping lightweight. If data mappings change, memo holds steady references.

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  
  const handleBulkStatus = async (status: 'active' | 'paused') => {
    try {
      await Promise.all(selectedRows.map(row => adminUpdateListing(row.original.id, { status })));
      void refetch();
      void refreshListings();
      table.resetRowSelection();
    } catch {
      console.error("Bulk status update failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} items? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedRows.map(row => apiRequest(`/admin/listings/${row.original.id}`, { method: 'DELETE' })));
      void refetch();
      void refreshListings();
      table.resetRowSelection();
    } catch {
      console.error("Bulk delete failed");
    }
  };

  const inputCls = "h-9 bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-[11px] font-sans px-3 outline-none focus:border-[#c9a96e]/50 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted/25">
          {totalFilteredCount} fragrances total
        </p>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="bg-[#c9a96e] text-[#080604] font-sans text-[10px] tracking-[0.25em] font-medium uppercase px-5 py-2.5 hover:bg-[#e8c87a] transition-colors duration-300"
        >
          + Add Perfume
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/50" />
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
          <option value="paused" className="bg-[#130e08]">Hidden</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={inputCls}>
          <option value="" className="bg-[#130e08]">All Stock</option>
          <option value="low" className="bg-[#130e08]">Low Stock (&lt;15)</option>
        </select>
      </div>

      {/* 4. BULK ACTION BAR */}
      {selectedRows.length > 0 && (
        <div className="sticky top-[80px] z-20 flex items-center gap-4 bg-[#c9a96e]/10 border border-[#c9a96e]/30 px-5 py-4 mb-4 backdrop-blur-md shadow-lg rounded-sm animate-in fade-in slide-in-from-top-2">
          <span className="font-sans text-xs font-medium text-[#c9a96e] tracking-wide">
            {selectedRows.length} product{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => void handleBulkStatus('active')}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium text-[10px] uppercase tracking-wider px-4 py-2 hover:bg-emerald-500/20 transition-colors"
            >
              Activate All
            </button>
            <button
              onClick={() => void handleBulkStatus('paused')}
              className="bg-white/5 text-muted/50 border border-white/10 font-sans font-medium text-[10px] uppercase tracking-wider px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Hide All
            </button>
            <button
              onClick={() => void handleBulkDelete()}
              className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans font-medium text-[10px] uppercase tracking-wider px-4 py-2 hover:bg-rose-500/20 transition-colors"
            >
              Delete Selected
            </button>
          </div>
          <button
            onClick={() => table.resetRowSelection()}
            className="text-muted/40 hover:text-white transition-colors ml-4 font-sans text-xs flex items-center gap-1"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* 3. TANSTACK TABLE */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-[#c9a96e]/5">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-5 py-4 text-[10px] tracking-[0.22em] uppercase text-muted/45 font-normal whitespace-nowrap
                      ${header.id === 'name' ? 'sticky left-0 z-10 bg-[#0d0a07]' : ''}
                      ${header.column.getCanSort() ? 'cursor-pointer hover:text-[#c9a96e]/70 select-none transition-colors' : ''}
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {/* 5. COLUMN SORTING HEADERS */}
                      {{
                        asc: <span className="text-[#c9a96e]">↑</span>,
                        desc: <span className="text-[#c9a96e]">↓</span>,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // 6. SKELETON ROWS
              Array(5).fill(null).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-[#c9a96e]/4 last:border-0">
                  {columns.map((_, j) => (
                    <td key={j} className="px-5 py-5">
                      <div className="h-4 bg-[#c9a96e]/10 rounded-sm w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-muted/40 font-sans text-sm">
                  No products found. Try clearing filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-[#c9a96e]/4 hover:bg-[#c9a96e]/5 transition-colors last:border-0">
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className={`px-5 py-4 align-middle ${cell.column.id === 'name' ? 'sticky left-0 z-10 bg-[#0d0a07] group-hover:bg-[#110d0a]' : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalFilteredCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-[11px] text-muted/40 pt-2 font-sans tracking-wide">
          <span>
            Showing {(serverPage - 1) * PAGE_SIZE + 1} - {Math.min(serverPage * PAGE_SIZE, totalFilteredCount)} of {totalFilteredCount} products
          </span>
          <div className="flex gap-2">
            <button
              disabled={serverPage === 1}
              onClick={() => setServerPage(p => p - 1)}
              className="px-3 py-1 border border-[#c9a96e]/15 hover:border-[#c9a96e]/50 disabled:opacity-30 disabled:hover:border-[#c9a96e]/15 transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1">Page {serverPage} of {totalPages}</span>
            <button
              disabled={serverPage === totalPages}
              onClick={() => setServerPage(p => p + 1)}
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
