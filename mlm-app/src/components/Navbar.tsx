import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWishlist } from "../context/WishlistContext";
import { User, Heart, ShoppingBag, LogOut, Package, Wallet } from "lucide-react";

import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { count: wishlistCount } = useWishlist();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isLoggedIn, logout, userName } = useAuth();

  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0705]/95 backdrop-blur-xl border-b border-[#c9a96e]/10">
      <div className="px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#c9a96e] to-[#8b6914] opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="text-base tracking-[0.3em] uppercase font-light text-[#e8dcc8] group-hover:text-[#c9a96e] transition-colors duration-300">
              HADI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-8 md:flex">
            <Link
              to="/"
              className={`text-xs tracking-widest uppercase transition-all duration-200 relative group ${
                location.pathname === "/"
                  ? "text-[#c9a96e]"
                  : "text-[#e8dcc8]/50 hover:text-[#e8dcc8]"
              }`}
            >
              Home
              {location.pathname === "/" && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#c9a96e]/60" />
              )}
            </Link>
            <Link
              to="/product"
              className={`text-xs tracking-widest uppercase transition-all duration-200 relative ${
                location.pathname === "/product" || location.pathname.startsWith("/product/")
                  ? "text-[#c9a96e]"
                  : "text-[#e8dcc8]/50 hover:text-[#e8dcc8]"
              }`}
            >
              Collection
              {(location.pathname === "/product" || location.pathname.startsWith("/product/")) && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#c9a96e]/60" />
              )}
            </Link>
          </div>

          {/* Icons Section */}
          <div className="flex items-center gap-4">
            
            {/* USER ACCOUNT ICON & DROPDOWN */}
            <div 
              className="relative group hidden md:flex items-center"
              onMouseEnter={() => isLoggedIn && setIsProfileOpen(true)}
              onMouseLeave={() => isLoggedIn && setIsProfileOpen(false)}
            >
              <Link 
                to={isLoggedIn ? "/profile" : "/login"} 
                className="relative group inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
                aria-label="User Account"
              >
                <User className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
                {isLoggedIn && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#c9a96e] rounded-full border border-[#0a0705]"></span>
                )}
              </Link>

              {/* THE MODERN DROPDOWN */}
              {isLoggedIn && (
                <div className={`absolute right-0 top-full pt-4 transition-all duration-300 ${
                  isProfileOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 pointer-events-none"
                }`}>
                  <div className="w-56 bg-[#0a0705]/95 backdrop-blur-xl border border-[#c9a96e]/20 rounded-lg shadow-2xl overflow-hidden p-2">
                    
                    <div className="px-4 py-3 border-b border-[#c9a96e]/10 mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]">Welcome back</p>
                      <p className="font-display text-lg text-[#e8dcc8]">{userName || 'User'}</p>
                    </div>

                    <Link
                      to="/profile"
                      state={{ tab: "account" }}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link
                      to="/profile"
                      state={{ tab: "orders" }}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors"
                    >
                      <Package className="w-4 h-4" /> My Collection
                    </Link>
                    <Link
                      to="/profile"
                      state={{ tab: "wallet" }}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors"
                    >
                      <Wallet className="w-4 h-4" /> Hadi Reserve
                    </Link>

                    <div className="mt-2 pt-2 border-t border-[#c9a96e]/10">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative group inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
            >
              <Heart className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] text-white bg-red-500 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative group inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40 cart-icon-target"
            >
              <ShoppingBag className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] text-white bg-red-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}