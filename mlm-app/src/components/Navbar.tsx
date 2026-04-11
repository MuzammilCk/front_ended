import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { User, Heart, ShoppingBag, LogOut, Package, Wallet } from "lucide-react";

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
}

export default function Navbar({ cartCount = 0, wishlistCount = 0 }: NavbarProps) {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isLoggedIn, logout, userName } = useAuth();

  // Define all navigation items
  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Products", path: "/product", icon: "✨" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  // Filter out the current page from dropdown
  const availablePages = navItems.filter(item => item.path !== location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#222]">
      <div className="px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl tracking-wide font-display">
            HADI
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-6 md:flex">
            <Link 
              to="/" 
              className={`text-sm transition-colors ${
                location.pathname === "/" 
                  ? "text-white" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/product" 
              className={`text-sm transition-colors ${
                location.pathname === "/product" 
                  ? "text-white" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Products
            </Link>
            <Link 
              to="/profile" 
              className={`text-sm transition-colors ${
                location.pathname === "/profile" 
                  ? "text-white" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Profile
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

                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8dcc8]/70 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-md transition-colors">
                      <Wallet className="w-4 h-4" /> Wallet
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
              className="relative group inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
            >
              <ShoppingBag className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] text-white bg-red-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Dropdown Menu */}
            <div className="relative md:hidden">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Open menu"
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#222] rounded-lg shadow-xl z-50">
                    <div className="py-2">
                      {availablePages.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm transition-colors text-white/70 hover:text-white hover:bg-white/5"
                        >
                          <span>{item.icon}</span>
                          {item.name}
                        </Link>
                      ))}
                      
                      <div className="mt-2 border-t border-[#222]">
                        {isLoggedIn ? (
                          <>
                            <div className="px-4 py-3">
                              <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]">Logged in as</p>
                              <p className="font-display text-sm text-[#e8dcc8]">{userName || 'User'}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setIsDropdownOpen(false);
                                logout();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-colors text-left"
                            >
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </>
                        ) : (
                          <Link 
                            to="/login"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm transition-colors text-[#c9a96e] hover:bg-white/5"
                          >
                            <User className="w-4 h-4" /> Login
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}