import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
}

export default function Navbar({ cartCount = 0, wishlistCount = 0 }: NavbarProps) {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
            AURORE
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
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative group inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
            >
              <svg className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
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
              <svg className="w-5 h-5 transition-colors text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
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