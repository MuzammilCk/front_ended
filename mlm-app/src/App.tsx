import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard } from "./components/AuthGuard";
import Home from "./pages/Home";
import Product from "./pages/Product";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import OrderDetails from "./pages/OrderDetails";
import MobileBottomNav from "./components/MobileBottomNav";
import GlobalNavbar from "./components/Navbar";

// Admin layout + tab components
import AdminLayout from "./components/admin-components/AdminLayout";
import DashboardTab from "./components/admin-components/DashboardTab";
import ProductsTab from "./components/admin-components/ProductsTab";
import AddProductTab from "./components/admin-components/AddProductTab";
import OrdersTab from "./components/admin-components/OrdersTab";
import InventoryTab from "./components/admin-components/InventoryTab";
import CategoriesTab from "./components/admin-components/CategoriesTab";
import AuditLogTab from "./components/admin-components/AuditLogTab";
import HomepageCmsTab from "./components/admin-components/HomepageCmsTab";
import NetworkTab from "./components/admin-components/NetworkTab";
import DisputesTab from "./components/admin-components/DisputesTab";
import ReturnsTab from "./components/admin-components/ReturnsTab";
import PayoutsTab from "./components/admin-components/PayoutsTab";
import { AdminDataProvider } from "./context/AdminContext";

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");
  const isCheckout = location.pathname.startsWith("/checkout");

  return (
    <>
      {/* ── Global Desktop Navbar (hidden on Home, Admin, and Checkout) ── */}
      {!isHome && !isAdmin && !isCheckout && (
        <div className="hidden md:block">
          <GlobalNavbar />
        </div>
      )}

      <Routes>
        <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
        <Route path="/product" element={<ErrorBoundary><Product /></ErrorBoundary>} />
        <Route path="/shop" element={<Navigate to="/product" replace />} />
        <Route
          path="/product/:id"
          element={
            <ErrorBoundary>
              <ProductDetail />
            </ErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <ErrorBoundary>
              <AuthGuard>
                <Profile />
              </AuthGuard>
            </ErrorBoundary>
          }
        />
        <Route
          path="/cart"
          element={
            <ErrorBoundary>
              <AuthGuard>
                <Cart />
              </AuthGuard>
            </ErrorBoundary>
          }
        />
        <Route
          path="/checkout"
          element={
            <ErrorBoundary>
              <Checkout />
            </ErrorBoundary>
          }
        />
        <Route path="/wishlist" element={<ErrorBoundary><Wishlist /></ErrorBoundary>} />
        <Route
          path="/orders/:orderId"
          element={
            <ErrorBoundary>
              <AuthGuard>
                <OrderDetails />
              </AuthGuard>
            </ErrorBoundary>
          }
        />

        {/* ── Admin nested routes ── */}
        <Route
          path="/admin"
          element={
            <ErrorBoundary>
              <AuthGuard requiredRole={['admin', 'content_manager']}>
                <AdminDataProvider>
                  <AdminLayout />
                </AdminDataProvider>
              </AuthGuard>
            </ErrorBoundary>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardTab />} />
          <Route path="products" element={<ProductsTab />} />
          <Route path="products/new" element={<AddProductTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="inventory" element={<InventoryTab />} />
          <Route path="categories" element={<CategoriesTab />} />
          <Route path="audit" element={<AuditLogTab />} />
          <Route path="homepage" element={<HomepageCmsTab />} />
          <Route path="network" element={<NetworkTab />} />
          <Route path="trust/disputes" element={<DisputesTab />} />
          <Route path="trust/returns" element={<ReturnsTab />} />
          <Route path="finance/payouts" element={<PayoutsTab />} />
        </Route>
      </Routes>

      <MobileBottomNav />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
