import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWishlist } from "../context/WishlistContext";
import { User, Heart, ShoppingBag, LogOut, Package, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "../lib/motion";

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
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto px-[clamp(1.5rem,5vw,4rem)] py-[1.25rem]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="Hadi Perfumes" className="h-[26px] w-auto object-contain scale-[1.5] origin-left transform transition-transform duration-300 group-hover:scale-[1.65]" />
        </Link>

        {/* Desktop Navigation */}
        <div className="items-center hidden gap-8 md:flex">
          <Link
            to="/"
            className={`text-label transition-all duration-200 relative group ${
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
            className={`text-label transition-all duration-200 relative ${
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
              className="relative group inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
              aria-label="User Account"
            >
              <User className="w-[18px] h-[18px] transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
            </Link>

              {/* THE MODERN DROPDOWN */}
              <AnimatePresence>
                {isLoggedIn && isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full pt-4 z-50 origin-top-right"
                  >
                    <div className="w-56 bg-[#0d0905]/95 backdrop-blur-xl border border-[#c9a96e]/10 rounded-sm shadow-2xl overflow-hidden py-1">

                      <div className="px-4 py-3 border-b border-[#c9a96e]/10 mb-1">
                        <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/70 mb-1">Welcome back</p>
                        <p className="font-display text-lg text-[#e8dcc8] tracking-wider leading-tight">{userName || 'User'}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          state={{ tab: "account" }}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#e8dfd0] hover:bg-white/5 transition-colors"
                        >
                          <User size={16} strokeWidth={1.5} /> My Profile
                        </Link>
                        <Link
                          to="/profile"
                          state={{ tab: "orders" }}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#e8dfd0] hover:bg-white/5 transition-colors"
                        >
                          <Package size={16} strokeWidth={1.5} /> My Collection
                        </Link>
                        <Link
                          to="/profile"
                          state={{ tab: "wallet" }}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#e8dfd0] hover:bg-white/5 transition-colors"
                        >
                          <Wallet size={16} strokeWidth={1.5} /> Hadi Reserve
                        </Link>
                      </div>

                      <div className="mt-1 pt-1 border-t border-[#c9a96e]/10">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <LogOut size={16} strokeWidth={1.5} /> Sign Out
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative group inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
          >
            <Heart className="w-[18px] h-[18px] transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-[#0a0705] bg-[#c9a96e] rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative group inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40 cart-icon-target"
          >
            <ShoppingBag className="w-[18px] h-[18px] transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-[#0a0705] bg-[#c9a96e] rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
