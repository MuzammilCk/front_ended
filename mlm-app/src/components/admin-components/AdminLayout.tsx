import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({ children, tab, setTab }) {
  return (
    <div className="min-h-screen bg-[#080604] text-[#e8dcc8] flex">
      <Sidebar tab={tab} setTab={setTab} />

      <main className="flex-1 overflow-y-auto">
        <Topbar tab={tab} />
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}