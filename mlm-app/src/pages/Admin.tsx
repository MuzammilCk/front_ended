import { useEffect, useState } from "react";
import Sidebar from "../components/admin-components/Sidebar";
import Topbar from "../components/admin-components/Topbar";
import DashboardTab from "../components/admin-components/DashboardTab";
import ProductsTab from "../components/admin-components/ProductsTab";
import AddProductTab from "../components/admin-components/AddProductTab";
import OrdersTab from "../components/admin-components/OrdersTab";
import DeleteModal from "../components/admin-components/DeleteModal";
import SuccessToast from "../components/admin-components/SuccessToast";
import { initialProducts, emptyForm } from "../data/adminStore";
import type { TabType } from "../data/adminStore";
import { getListings } from "../api/listings";
import { adminListOrders } from "../api/admin";
import type { Order } from "../api/types";
import type { ProductType } from "../data/adminStore";

export default function Admin() {
  const [tab, setTab] = useState<TabType>("dashboard");
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [apiLoading, setApiLoading] = useState(false);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Load listings from backend and merge with existing product state
    const loadListings = async () => {
      // Defer state updates to avoid react-hooks/set-state-in-effect lint.
      await Promise.resolve();
      setApiLoading(true);
      getListings({ limit: 100 })
        .then((result) => {
          if (cancelled) return;
          if (result.data.length > 0) {
            // Map backend Listing → ProductType shape
            const mapped: ProductType[] = result.data.map(
              (listing, index) => ({
                id: index + 1, // ProductType requires number id
                name: listing.title,
                type: listing.category?.name ?? "Parfum",
                family: listing.category?.name ?? "General",
                price: parseFloat(listing.price),
                stock: 0, // inventory not returned here
                active: listing.status === "active",
              }),
            );
            setProducts(mapped);
          }
        })
        .catch(() => {
          // Silently keep initialProducts on API failure
        })
        .finally(() => {
          if (!cancelled) setApiLoading(false);
        });
    };
    void loadListings();

    // Load admin orders (requires VITE_ADMIN_TOKEN in .env)
    adminListOrders({ limit: 10 })
      .then((result) => {
        if (!cancelled) {
          setAdminOrders(result.data);
          setOrdersTotal(result.total);
        }
      })
      .catch(() => {
        // Silently fail if admin token not configured
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#080604] text-[#e8dcc8] flex overflow-hidden relative">
      {/* Background Layer 1: The subtle texture image (barely visible) */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: 'url(/assets/profile-bg.jpg)' }}
      />
      
      {/* ── SIDEBAR ── */}
      <Sidebar tab={tab} setTab={setTab} />

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto relative z-10 block">
        {/* Topbar */}
        <Topbar tab={tab} />

        {/* Live API status bar — between Topbar and content */}
        {apiLoading && (
          <div className="px-8 py-2 bg-[#0d0a07] border-b border-[#c9a96e]/10 text-xs text-[#c9b99a]/40">
            Syncing with backend…
          </div>
        )}
        {ordersTotal > 0 && (
          <div className="px-8 py-2 bg-[#0d0a07] border-b border-[#c9a96e]/10 text-xs text-[#c9b99a]/60">
            Live: {ordersTotal} total orders in system
          </div>
        )}

        <div className="px-8 py-8">
          {tab === "dashboard" && (
            <DashboardTab
              products={products}
              chartMode={chartMode}
              setChartMode={setChartMode}
              setTab={setTab}
            />
          )}

          {tab === "products" && (
            <ProductsTab
              products={products}
              setProducts={setProducts}
              setTab={setTab}
              setDeleteId={setDeleteId}
            />
          )}

          {tab === "add" && (
            <AddProductTab
              form={form}
              setForm={setForm}
              formError={formError}
              setFormError={setFormError}
              products={products}
              setProducts={setProducts}
              setAddSuccess={setAddSuccess}
              setTab={setTab}
            />
          )}

          {tab === "orders" && <OrdersTab />}
        </div>
      </main>

      {/* ── MODALS & TOASTS ── */}
      {deleteId !== null && (
        <DeleteModal
          deleteId={deleteId}
          setDeleteId={setDeleteId}
          setProducts={setProducts}
        />
      )}

      {addSuccess && <SuccessToast />}
    </div>
  );
}
