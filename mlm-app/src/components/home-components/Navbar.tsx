import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 60;

const NAV_ITEMS = [
  { label: "Home", to: "/" as const },
  { label: "Collection", to: "/product" as const },
  { label: "Atelier", to: "/product" as const },
  { label: "Journal", to: "/product" as const },
];

function navItemIsActive(pathname: string, label: string, to: string) {
  if (to === "/") return pathname === "/";
  if (label === "Collection")
    return pathname === "/product" || pathname.startsWith("/product/");
  return false;
}

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

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

  return (
    <header
      className={`nb-header fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? "nb-scrolled" : "nb-top"
      }`}
    >
      <div className="nb-inner">
        <Link
          ref={logoRef}
          to="/"
          className="nb-logo"
          onMouseMove={onLogoMove}
          onMouseLeave={onLogoLeave}
        >
          <span className="nb-logo-stack">
            <span className="nb-logo-text">HADI</span>
            <span className="nb-logo-sub">PERFUMES</span>
          </span>
        </Link>

        <nav className="nb-nav nb-nav-desktop" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = navItemIsActive(location.pathname, item.label, item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nb-link${active ? " nb-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nb-actions">
          <Link to="/login" className="nb-action-link nb-login-desktop">
            Login
          </Link>
          <span className="nb-divider nb-login-desktop" aria-hidden />
          <Link to="/wishlist" className="nb-icon-btn" aria-label="Wishlist">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
          <Link to="/cart" className="nb-icon-btn" aria-label="Cart">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </Link>

          <button
            type="button"
            className="nb-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="nb-mobile-panel"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="nb-mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        id="nb-mobile-panel"
        className={`nb-mobile-panel${mobileOpen ? " nb-mobile-panel--open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <nav className="nb-mobile-nav" aria-label="Mobile primary">
          {NAV_ITEMS.map((item) => {
            const active = navItemIsActive(location.pathname, item.label, item.to);
            return (
              <Link
                key={`m-${item.label}`}
                to={item.to}
                className={`nb-mobile-link${active ? " nb-mobile-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="nb-mobile-actions">
          <Link
            to="/login"
            className="nb-mobile-link nb-mobile-link--muted"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
          <div className="nb-mobile-icons">
            <Link
              to="/wishlist"
              className="nb-icon-btn nb-icon-btn--lg"
              aria-label="Wishlist"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>
            <Link
              to="/cart"
              className="nb-icon-btn nb-icon-btn--lg"
              aria-label="Cart"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
