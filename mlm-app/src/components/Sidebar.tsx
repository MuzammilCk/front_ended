import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { clearTokens } from "../api/client";
import { logout as apiLogout } from "../api/auth";
import {
  X,
  Home,
  Package,
  User,
  Heart,
  ShoppingBag,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  cartCount?: number;
  wishlistCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  cartCount = 0,
  wishlistCount = 0,
  isOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ✅ Auto close on route change
  useEffect(() => {
    if (isOpen) onCloseRef.current();
    // Intentionally depends only on location change.
    // `onClose` can be an unstable inline function from pages.
  }, [location.pathname]);

  // ✅ Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // ✅ Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Products", path: "/product", icon: Package },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Wishlist", path: "/wishlist", icon: Heart, badge: wishlistCount },
    { name: "Cart", path: "/cart", icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <>
      {/* Premium Overlay - Matching home page color scheme */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 
          bg-black/50 backdrop-blur-sm
          transition-all duration-500 ease-out
          ${
            isOpen
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none"
          }
        `}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 
          bg-[#0a0705]/95 backdrop-blur-xl
          shadow-2xl
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          flex flex-col
          ${isOpen ? "pointer-events-auto" : "pointer-events-none md:pointer-events-auto"}
          
          /* OFF-CANVAS DRAWER (ALL SIZES) */
          top-0 bottom-0 left-0 right-auto
          w-80 max-w-[85vw]
          rounded-none rounded-r-2xl
          transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-[#c9a96e]/10">
          {/* Close Button */}
          <button
            onClick={onClose}
            type="button"
            aria-label="Close navigation menu"
            className="
    absolute right-4 top-6
    p-2 rounded-lg
    bg-white/5 hover:bg-white/10
    text-[#e8dcc8]/70 hover:text-[#c9a96e]
    transition-all duration-300
    backdrop-blur-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40
  "
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" onClick={onClose} className="block group">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#c9a96e] to-[#8b6914]" />
              <span className="text-2xl font-light tracking-wider text-[#e8dcc8]">
                HADI
              </span>
            </div>
            <p className="mt-2 text-xs tracking-wide text-[#c9b99a]/60">
              LUXURY ESSENTIALS
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  group relative flex items-center justify-between px-4 py-3 
                  text-sm font-medium transition-all duration-300 rounded-xl
                  ${
                    isActive
                      ? "text-[#c9a96e] bg-gradient-to-r from-[#c9a96e]/10 to-transparent shadow-lg"
                      : "text-[#e8dcc8]/60 hover:text-[#e8dcc8] hover:bg-[#c9a96e]/5"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                      isActive
                        ? "text-[#c9a96e]"
                        : "text-[#e8dcc8]/60 group-hover:text-[#c9a96e]"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`
                    px-2 py-0.5 text-xs font-semibold rounded-full
                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#c9a96e] to-[#8b6914] text-[#0a0705]"
                        : "bg-[#c9a96e]/80 text-[#0a0705]"
                    }
                  `}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 rounded-r-full bg-gradient-to-b from-[#c9a96e] to-[#8b6914]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px mx-6 bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />

        {/* Footer */}
        <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#e8dcc8]/60 hover:text-[#c9a96e] transition-all duration-300 rounded-xl hover:bg-[#c9a96e]/5 group"
            onClick={async () => {
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                try {
                  await apiLogout(refreshToken);
                } catch {
                  clearTokens();
                }
              } else {
                clearTokens();
              }
              navigate('/login');
            }}
          >
            <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span>Sign Out</span>
          </button>

          <div className="text-center">
            <p className="text-xs tracking-wide text-[#c9b99a]/40">
              © 2025 HADI perfumes. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
