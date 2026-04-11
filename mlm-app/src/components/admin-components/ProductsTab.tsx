import type { AdminTabType, AdminProductType } from "../../api/types";

interface ProductsTabProps {
  products: AdminProductType[];
  setProducts: React.Dispatch<React.SetStateAction<AdminProductType[]>>;
  setTab: (tab: AdminTabType) => void;
  setDeleteId: (id: number) => void;
}

export default function ProductsTab({
  products,
  setProducts,
  setTab,
  setDeleteId,
}: ProductsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/25">
          {products.length} fragrances ·{" "}
          {products.filter((p) => p.active).length} active
        </p>
        <button
          onClick={() => setTab("add")}
          className="bg-[#c9a96e] text-[#080604] text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 hover:bg-[#e8c87a] transition-colors duration-300 font-light"
        >
          + Add Perfume
        </button>
      </div>

      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08]">
        <div className="grid grid-cols-7 py-3 px-5 border-b border-[#c9a96e]/5">
          {[
            "Name",
            "Type",
            "Family",
            "Price",
            "Stock",
            "Status",
            "Actions",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] tracking-[0.22em] uppercase text-[#c9b99a]/20"
            >
              {h}
            </span>
          ))}
        </div>
        {products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-7 py-4 px-5 border-b border-[#c9a96e]/4 items-center hover:bg-[#c9a96e]/3 transition-colors"
          >
            <span className="font-serif text-lg font-light text-[#e8dcc8]">
              {p.name}
            </span>
            <span className="text-[11px] text-[#c9b99a]/40">{p.type}</span>
            <span className="text-[11px] text-[#c9b99a]/40">{p.family}</span>
            <span className="text-[11px] text-[#c9a96e]">INR {p.price}</span>
            <span
              className={`text-[11px] ${p.stock < 15 ? "text-rose-400" : "text-[#c9b99a]/50"}`}
            >
              {p.stock} {p.stock < 15 ? "⚠" : ""}
            </span>
            <span
              className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 w-fit border
              ${p.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-[#c9b99a]/30 border-white/10"}`}
            >
              {p.active ? "Active" : "Hidden"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setProducts((prev) =>
                    prev.map((x) =>
                      x.id === p.id ? { ...x, active: !x.active } : x,
                    ),
                  )
                }
                className={`w-9 h-5 rounded-full border relative transition-all duration-300 shrink-0
                  ${p.active ? "bg-[#c9a96e]/30 border-[#c9a96e]/60" : "bg-white/5 border-white/15"}`}
              >
                <div
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300
                  ${p.active ? "left-[18px] bg-[#c9a96e]" : "left-0.5 bg-[#c9b99a]/30"}`}
                />
              </button>
              <button
                onClick={() => setDeleteId(p.id)}
                className="text-sm transition-colors duration-200 text-rose-400/30 hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
