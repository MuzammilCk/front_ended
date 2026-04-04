import { Link } from "react-router-dom";
import { navItems } from "../../data/adminStore";
import type { TabType } from "../../data/adminStore";

export default function Sidebar({
  tab,
  setTab,
}: {
  tab: TabType;
  setTab: (t: TabType) => void;
}) {
  return (
    <aside className="w-56 shrink-0 min-h-screen flex flex-col border-r border-[#c9a96e]/10 bg-[#0d0a07]">
      <div className="px-5 py-6 border-b border-[#c9a96e]/10">
        <Link
          to="/"
          className="font-serif text-xl font-light tracking-[0.15em] text-[#e8dcc8]"
        >
          AURORE
        </Link>
        <p className="text-[#c9b99a]/20 mt-1 text-[10px] tracking-[0.25em] uppercase">
          Admin Console
        </p>
      </div>

      <nav className="flex flex-col flex-1 gap-1 py-6">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-light border-l-2 transition-all duration-300 text-left w-full
              ${
                tab === item.key
                  ? "border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/5"
                  : "border-transparent text-[#c9b99a]/30 hover:text-[#e8dcc8] hover:bg-[#c9a96e]/5"
              }`}
          >
            <span className="font-mono text-sm">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-5 py-5 border-t border-[#c9a96e]/10">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9b99a]/20 leading-5">
          Logged in as
          <br />
          <span className="text-[#c9b99a]/40">admin@aurore.com</span>
        </p>
      </div>
    </aside>
  );
}
