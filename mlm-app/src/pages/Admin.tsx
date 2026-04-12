import { useEffect, useState } from "react";
import AdminSidebar from "../components/admin-components/Sidebar";
import Topbar from "../components/admin-components/Topbar";
import DashboardTab from "../components/admin-components/DashboardTab";
import ProductsTab from "../components/admin-components/ProductsTab";
import AddProductTab from "../components/admin-components/AddProductTab";
import OrdersTab from "../components/admin-components/OrdersTab";
import AuditLogTab from "../components/admin-components/AuditLogTab";
import DeleteModal from "../components/admin-components/DeleteModal";
import SuccessToast from "../components/admin-components/SuccessToast";
import { adminListOrders, adminGetListings } from "../api/admin";
import type { Order, AdminProductType, AdminTabType } from "../api/types";

const EMPTY_FORM = {
  name: "",
  type: "Eau de Parfum",
  family: "Woody",
  price: "",
  ml: "50",
  notes: "",
  badge: "",
  intensity: "70",
};

export default function Admin() {
  const [tab, setTab] = useState<AdminTabType>("dashboard");
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");
  const [products, setProducts] = useState<AdminProductType[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      adminGetListings({ limit: 100 })
        .then((result) => {
          if (cancelled) return;
          if (result.data.length > 0) {
            // Map backend Listing → AdminProductType shape
            const mapped: AdminProductType[] = result.data.map(
              (listing) => ({
                id: listing.id, // Use backend UUID
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

    // Load admin orders
    adminListOrders({ limit: 10 })
      .then((result) => {
        if (!cancelled) {
          setAdminOrders(result.data);
          setOrdersTotal(result.total);
        }
      })
      .catch(() => {
        // Silently fail if not authorized
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
      <AdminSidebar tab={tab} setTab={setTab} />

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto relative z-10 block">
        {/* Topbar */}
        <Topbar tab={tab} />

        {/* Live API status bar — between Topbar and content */}
        {apiLoading && (
          <div className="px-8 py-2 bg-[#0d0a07] border-b border-[#c9a96e]/10 text-xs text-muted/40">
            Syncing with backend…
          </div>
        )}
        {ordersTotal > 0 && (
          <div className="px-8 py-2 bg-[#0d0a07] border-b border-[#c9a96e]/10 text-xs text-muted/60">
            Live: {ordersTotal} total orders in system
          </div>
        )}

        <div className="px-8 py-8">
          {tab === "dashboard" && (
            <DashboardTab
              products={products}
              orders={adminOrders}
              ordersTotal={ordersTotal}
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

          {tab === "orders" && <OrdersTab orders={adminOrders} />}

          {tab === "audit" && <AuditLogTab />}
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
