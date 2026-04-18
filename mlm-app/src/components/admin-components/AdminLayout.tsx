import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getAdminDashboardStats } from "../../api/admin";

const queryClient = new QueryClient();

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-[200px] w-full bg-[#c9a96e]/5 border border-[#c9a96e]/10 animate-pulse" />
      <div className="h-[200px] w-full bg-[#c9a96e]/5 border border-[#c9a96e]/10 animate-pulse" />
      <div className="h-[200px] w-full bg-[#c9a96e]/5 border border-[#c9a96e]/10 animate-pulse" />
    </div>
  );
}

function AdminLayoutInner() {
  const location = useLocation();
  const qClient = useQueryClient();

  // Prefetch dashboard stats on mount to make /admin/dashboard instant
  useEffect(() => {
    void qClient.prefetchQuery({
      queryKey: ["adminDashboardStats"],
      queryFn: getAdminDashboardStats,
      staleTime: 5 * 60 * 1000, // 5 min
    });
  }, [qClient]);

  return (
    <div className="min-h-screen bg-[#080604] text-[#e8dcc8] flex overflow-hidden relative">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: "url(/assets/profile-bg.jpg)" }}
      />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10 block">
        <Topbar />
        <Suspense fallback={<div className="px-8 py-8"><TabSkeleton /></div>}>
          <div key={location.pathname} className="px-8 py-8 anim-route">
            <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayoutInner />
    </QueryClientProvider>
  );
}
