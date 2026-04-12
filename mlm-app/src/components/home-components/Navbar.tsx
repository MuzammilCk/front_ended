import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "../../lib/motion";
import { Heart, Menu, Search, ShoppingBag, X, ArrowRight, User, LogOut, Package, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { getListings } from "../../api/listings";
import gsap from "gsap";
import type { Listing } from "../../api/types";
import "../../styles/Navbar.css";

const SCROLL_THRESHOLD = 60;
const MOBILE_BREAKPOINT = 900;
const MEGA_MENU_CLOSE_DELAY = 300;

const NAV_LINKS = [
  { label: "Home", to: "/" as const, mega: false },
  { label: "Shop", to: "/product" as const, mega: true },
  { label: "Atelier", to: "/product" as const, mega: true },
  { label: "Journal", to: "/" as const, mega: false },
  { label: "About", to: "/" as const, mega: false },
] as const;

type MegaMenuKind = "shop" | "atelier" | null;

function isMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function navItemIsActive(pathname: string, label: string, to: string) {
  if (label === "Shop") {
    return pathname === "/product" || pathname.startsWith("/product/");
  }
  if (to === "/") return pathname === "/";
  return pathname === to;
}

export default function Navbar() {
  const { isLoggedIn, logout, userName } = useAuth();
  const { count: cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [megaMenu, setMegaMenu] = useState<MegaMenuKind>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const logoRef = useRef<HTMLAnchorElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const megaMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLAnchorElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // GSAP animation on Cart Count change
  useEffect(() => {
    if (!cartIconRef.current || cartCount === 0) return;
    
    // Scale 1 -> 1.3 -> 1 with a gold pulse ring
    const tl = gsap.timeline();
    tl.to(cartIconRef.current, { scale: 1.3, duration: 0.15, ease: "power2.out" })
      .to(cartIconRef.current, { scale: 1, duration: 0.25, ease: "bounce.out" });

    // Assuming we want a ring effect, we can animate box-shadow via GSAP
    gsap.fromTo(cartIconRef.current, 
      { boxShadow: "0 0 0 0 rgba(201, 169, 110, 0.7)" }, 
      { boxShadow: "0 0 0 10px rgba(201, 169, 110, 0)", duration: 0.6, ease: "power2.out" }
    );
  }, [cartCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMobileOpen(false);
      setMegaMenu(null);
      setPaletteOpen(false);
      setQuery("");
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
        setMegaMenu(null);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (paletteOpen) {
        paletteInputRef.current?.focus();
        return;
      }
      setQuery("");
      searchTriggerRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    const paletteEl = paletteRef.current;
    if (!paletteEl) return;

    const onTrapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = paletteEl.querySelectorAll<HTMLElement>(
        'input, button, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onTrapFocus);
    return () => window.removeEventListener("keydown", onTrapFocus);
  }, [paletteOpen]);

  useEffect(() => {
    const onResize = () => {
      if (isMobileViewport()) {
        setMegaMenu(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (megaMenuTimerRef.current) {
        clearTimeout(megaMenuTimerRef.current);
      }
    };
  }, []);

  const onLogoMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = logoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);
    const pull = 10;
    el.style.setProperty("--nb-mx", `${nx * pull}px`);
    el.style.setProperty("--nb-my", `${ny * pull}px`);
  }, []);

  const onLogoLeave = useCallback(() => {
    logoRef.current?.style.setProperty("--nb-mx", "0px");
    logoRef.current?.style.setProperty("--nb-my", "0px");
  }, []);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    setMobileOpen(false);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
  }, []);

  const clearMegaMenuTimer = useCallback(() => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
      megaMenuTimerRef.current = null;
    }
  }, []);

  const startMegaMenuCloseTimer = useCallback(() => {
    clearMegaMenuTimer();
    megaMenuTimerRef.current = setTimeout(() => {
      setMegaMenu(null);
    }, MEGA_MENU_CLOSE_DELAY);
  }, [clearMegaMenuTimer]);

  const openMegaMenu = useCallback(
    (menu: Exclude<MegaMenuKind, null>) => {
      if (isMobileViewport()) return;
      if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
      setMegaMenu(menu);
    },
    [clearMegaMenuTimer],
  );

  const [searchResults, setSearchResults] = useState<Listing[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      getListings({ q: query.trim(), limit: 6 })
        .then((result) => setSearchResults(result.data))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredProducts = searchResults;

  const quickLinks = useMemo(
    () => [
      { label: "All Fragrances", to: "/product" },
      { label: "Woody Collection", to: "/product" },
      { label: "Floral Collection", to: "/product" },
      { label: "Your Cart", to: "/cart" },
    ],
    [],
  );

  const categoryLinks =
    megaMenu === "atelier"
      ? [
          { label: "The Story", to: "/" },
          { label: "Our Process", to: "/" },
          { label: "Ingredients", to: "/" },
          { label: "Sustainability", to: "/" },
          { label: "Press", to: "/" },
        ]
      : [
          { label: "All Fragrances", to: "/product" },
          { label: "Woody & Resinous", to: "/product" },
          { label: "Floral & Romantic", to: "/product" },
          { label: "Fresh & Aquatic", to: "/product" },
          { label: "Oriental & Spicy", to: "/product" },
          { label: "New Arrivals", to: "/product" },
          { label: "Bestsellers", to: "/product" },
        ];

  return (
    <header className="nb2-header">
      <div className={`nb2-inner${scrolled ? " nb2-inner--pill" : ""}`}>
        <Link
          ref={logoRef}
          to="/"
          className="nb2-logo"
          onMouseMove={onLogoMove}
          onMouseLeave={onLogoLeave}
        >
          <span className="nb2-logo-stack">
            <span className="nb2-logo-text">HADI</span>
            <span className="nb2-logo-sub">PERFUMES</span>
          </span>
        </Link>

        <nav className="nb2-nav nb2-nav-desktop" role="navigation" aria-label="Primary">
          {NAV_LINKS.map((item) => {
            const active = navItemIsActive(location.pathname, item.label, item.to);
            const menuType: Exclude<MegaMenuKind, null> | null =
              item.label === "Shop"
                ? "shop"
                : item.label === "Atelier"
                  ? "atelier"
                  : null;

            if (item.mega && menuType) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`nb2-link nb2-link-btn${active ? " nb2-link--active" : ""}`}
                  aria-expanded={megaMenu === menuType}
                  onMouseEnter={() => openMegaMenu(menuType)}
                  onMouseLeave={startMegaMenuCloseTimer}
                  onFocus={() => setMegaMenu(null)}
                  onClick={() => navigate(item.to)}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nb2-link${active ? " nb2-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nb2-actions">
          {/* USER ACCOUNT ICON & DROPDOWN */}
          {!isLoggedIn ? (
            <Link to="/login" className="nb2-icon-btn" aria-label="User Account">
              <User size={16} strokeWidth={1.5} />
            </Link>
          ) : (
            <div className="relative flex items-center" ref={profileDropdownRef}>
              <button 
                type="button"
                className="nb2-icon-btn"
                aria-label="User Account"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <User size={16} strokeWidth={1.5} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#0d0a07] border border-[#c9a96e]/20 rounded-lg shadow-2xl overflow-hidden text-left z-50 backdrop-blur-xl"
                  >
                    <div className="px-4 py-3 border-b border-[#c9a96e]/10">
                      <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/70">Welcome back</p>
                      <p className="font-display text-[#e8dcc8] text-lg mt-0.5">{userName ?? 'User'}</p>
                    </div>

                    <div className="py-1">
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8dcc8]/80 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 transition-colors">
                        <User size={16} strokeWidth={1.5} /> My Profile
                      </Link>
                      <Link to="/cart" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8dcc8]/80 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 transition-colors">
                        <Package size={16} strokeWidth={1.5} /> My Orders
                      </Link>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#e8dcc8]/80 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 transition-colors">
                        <Wallet size={16} strokeWidth={1.5} /> Wallet
                      </Link>
                    </div>

                    <div className="py-1 border-t border-[#c9a96e]/10">
                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          void logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400/90 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut size={16} strokeWidth={1.5} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Link to="/wishlist" className="nb2-icon-btn relative" aria-label="Wishlist">
            <Heart size={16} strokeWidth={1.5} />
          </Link>
          <Link ref={cartIconRef} to="/cart" className="nb2-icon-btn relative rounded-full" aria-label="Cart">
            <ShoppingBag size={16} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-[#0a0705] bg-[#c9a96e] rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            ref={searchTriggerRef}
            type="button"
            className="nb2-search-btn"
            onClick={openPalette}
            aria-label="Open command palette"
          >
            <Search size={15} strokeWidth={1.7} />
            <span className="nb2-search-kbd" aria-hidden>
              ⌘K
            </span>
          </button>

          <button
            type="button"
            className="nb2-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="nb2-mobile-panel"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {megaMenu ? (
          <motion.div
            className="nb2-megamenu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={clearMegaMenuTimer}
            onMouseLeave={startMegaMenuCloseTimer}
          >
            <div className="nb2-megamenu-inner">
              <div className="nb2-megamenu-left">
                <p className="nb2-mm-eyebrow">Browse by</p>
                <h3 className="nb2-mm-title">
                  {megaMenu === "shop" ? "The Collection" : "Our Craft"}
                </h3>
                <nav className="nb2-mm-links" role="navigation" aria-label="Mega menu">
                  {categoryLinks.map((item) => (
                    <Link key={`${megaMenu}-${item.label}`} to={item.to} className="nb2-mm-link">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="nb2-megamenu-right">
                <p className="nb2-mm-eyebrow">Featured</p>
                <h4 className="nb2-mm-product-name">Explore Collection</h4>
                <p className="nb2-mm-product-price">Discover our fragrances</p>
                <Link to="/product" className="nb2-mm-cta">
                  Shop Now <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {mobileOpen ? (
        <button
          type="button"
          className="nb2-mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        id="nb2-mobile-panel"
        className={`nb2-mobile-panel${mobileOpen ? " nb2-mobile-panel--open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <nav className="nb2-mobile-nav" role="navigation" aria-label="Mobile primary">
          {NAV_LINKS.map((item) => {
            const active = navItemIsActive(location.pathname, item.label, item.to);
            return (
              <Link
                key={`mobile-${item.label}`}
                to={item.to}
                className={`nb2-mobile-link${active ? " nb2-mobile-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="nb2-mobile-actions flex-col items-start gap-4 p-6 w-full">
          {isLoggedIn ? (
            <div className="w-full border-t border-[#c9a96e]/10 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#c9a96e]">Logged in as</p>
                  <p className="text-lg font-display text-[#e8dcc8]">{userName ?? 'User'}</p>
                </div>
              </div>
              <Link to="/profile" className="block py-2 text-sm text-[#e8dcc8]/70" onClick={() => setMobileOpen(false)}>View Profile</Link>
              <Link to="/cart" className="block py-2 text-sm text-[#e8dcc8]/70" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <button onClick={() => { setMobileOpen(false); void logout(); }} className="block w-full text-left py-2 text-sm text-red-400/80 mt-2">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="w-full border-t border-[#c9a96e]/10 pt-4">
              <Link to="/login" className="block w-full text-center py-3 border border-[#c9a96e] text-[#c9a96e] rounded-md text-xs uppercase tracking-widest" onClick={() => setMobileOpen(false)}>
                Sign In / Register
              </Link>
            </div>
          )}
        </div>

        <div className="nb2-mobile-icons pb-6 px-6">
          <Link to="/wishlist" className="nb2-icon-btn nb2-icon-btn--lg" aria-label="Wishlist" onClick={() => setMobileOpen(false)}>
            <Heart size={18} strokeWidth={1.5} />
          </Link>
          <Link to="/cart" className="nb2-icon-btn nb2-icon-btn--lg" aria-label="Cart" onClick={() => setMobileOpen(false)}>
            <ShoppingBag size={18} strokeWidth={1.5} />
          </Link>
          <button type="button" className="nb2-icon-btn nb2-icon-btn--lg" aria-label="Open command palette" onClick={openPalette}>
            <Search size={18} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {paletteOpen ? (
          <>
            <motion.div
              className="nb2-palette-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePalette}
            />
            <motion.div
              ref={paletteRef}
              className="nb2-palette"
              initial={{ opacity: 0, scale: 0.97, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="nb2-palette-input-row">
                <Search size={16} strokeWidth={1.7} aria-hidden />
                <input
                  ref={paletteInputRef}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search fragrances, categories..."
                  aria-label="Search fragrances"
                />
                <kbd>Esc</kbd>
              </div>

              <div className="nb2-palette-results">
                {!query.trim() ? (
                  quickLinks.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="nb2-palette-row"
                      onClick={() => closePalette()}
                    >
                      <ArrowRight size={14} strokeWidth={1.7} />
                      <span className="nb2-palette-quick-label">{item.label}</span>
                      <span className="nb2-palette-quick-route">{item.to}</span>
                    </Link>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="nb2-palette-row nb2-palette-result-btn"
                      onClick={() => {
                        navigate(`/product/${product.id}`);
                        closePalette();
                      }}
                    >
                      <span className="nb2-palette-thumb-fallback" aria-hidden />
                      <span className="nb2-palette-result-copy">
                        <span className="nb2-palette-result-name">{product.title}</span>
                        <span className="nb2-palette-result-family">{product.category?.name ?? 'Fragrance'}</span>
                      </span>
                      <span className="nb2-palette-price">INR {product.price}</span>
                    </button>
                  ))
                ) : (
                  <div className="nb2-palette-empty">No results found</div>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
