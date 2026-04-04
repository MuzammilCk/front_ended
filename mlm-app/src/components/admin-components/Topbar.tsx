import type { TabType } from "../../data/adminStore";

export default function Topbar({ tab }: { tab: TabType }) {
  return (
    <div className="sticky top-0 z-30 px-8 py-4 border-b border-[#c9a96e]/5 flex items-center justify-between bg-[#080604]/90 backdrop-blur-md">
      <div>
        <h1 className="font-serif text-2xl font-light text-[#e8dcc8]">
          {tab === "dashboard"
            ? "Dashboard"
            : tab === "products"
              ? "Product Catalogue"
              : tab === "add"
                ? "Add New Perfume"
                : "Order History"}
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9b99a]/20">
          Aurore Parfums · Admin
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
        <span className="text-[10px] tracking-[0.15em] uppercase text-emerald-400/40">
          Live
        </span>
      </div>
    </div>
  );
}
