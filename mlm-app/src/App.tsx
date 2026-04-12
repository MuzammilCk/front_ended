import { Routes, Route, Navigate } from "react-router-dom";
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
import Admin from "./pages/Admin";

function App() {
  return (
    <ErrorBoundary>
      <div>
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
                <AuthGuard>
                  <Checkout />
                </AuthGuard>
              </ErrorBoundary>
            }
          />
          <Route path="/wishlist" element={<ErrorBoundary><Wishlist /></ErrorBoundary>} />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <AuthGuard requiredRole={['admin', 'content_manager']}>
                  <Admin />
                </AuthGuard>
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
