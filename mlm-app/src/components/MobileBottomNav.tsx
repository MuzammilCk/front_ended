// mlm-app/src/components/MobileBottomNav.tsx
// Mobile-only bottom navigation bar.
// Renders ONLY on screens smaller than md (768px).
// Replaces the hamburger menu for core navigation on mobile.

import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../hooks/useAuth";

export default function MobileBottomNav() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { count: wishlistCount } = useWishlist();

  // Read cart count from CartContext — same source as Navbar uses
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const navItems = [
    {
      to: "/",
      icon: Home,
      label: "Home",
      exact: true,
    },
    {
      to: "/product",
      icon: Search,
      label: "Discover",
      exact: false,
    },
    {
      to: "/cart",
      icon: ShoppingBag,
      label: "Bag",
      exact: false,
      badge: cartCount,
    },
    {
      to: "/wishlist",
      icon: Heart,
      label: "Wishlist",
      exact: false,
      badge: wishlistCount,
    },
    {
      to: isLoggedIn ? "/profile" : "/login",
      icon: User,
      label: "Profile",
      exact: false,
    },
  ];

  // Do not render on pages where it would interfere
  // Admin panel has its own nav — hide there
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        md:hidden
        bg-[#0a0705]/95 backdrop-blur-xl
        border-t border-[#c9a96e]/10
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, exact, badge }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to) && to !== "/";

          return (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]"
            >
              {/* Icon wrapper */}
              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    isActive
                      ? "text-[#c9a96e]"
                      : "text-[#e8dcc8]/40"
                  }`}
                  strokeWidth={isActive ? 2 : 1.5}
                />

                {/* Badge */}
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex items-center justify-center w-4 h-4 text-[9px] font-semibold text-[#0a0705] bg-[#c9a96e] rounded-full leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${
                  isActive
                    ? "text-[#c9a96e]"
                    : "text-[#e8dcc8]/30"
                }`}
              >
                {label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c9a96e]" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
