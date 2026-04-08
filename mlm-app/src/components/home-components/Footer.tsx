import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="ft-footer">
      {/* Pre-footer closing statement */}
      <div className="ft-prefooter">
        <p className="ft-prefooter-eyebrow">Begin your olfactive journey</p>
        <h2 className="ft-prefooter-headline">
          Wear a story.<br />
          <em>Leave a memory.</em>
        </h2>
        <Link to="/product" className="ft-prefooter-cta">
          <span>Explore the Collection</span>
          <span className="ft-cta-arrow">→</span>
        </Link>
      </div>

      {/* Main footer body */}
      <div className="ft-body">
        <div className="ft-body-inner">
          {/* Column 1 — Brand */}
          <div className="ft-col ft-col--brand">
            <Link to="/" className="ft-logo">
              <span className="ft-logo-main">HADI</span>
              <span className="ft-logo-sub">PERFUMES</span>
            </Link>
            <p className="ft-brand-desc">
              Maison de parfum. Crafting stories through scent since 2012.
            </p>
            {/* Social icons */}
            <div className="ft-socials">
              {["IG", "TW", "YT", "TK"].map((s) => (
                <a key={s} href="#" className="ft-social-icon" aria-label={s}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Navigation */}
          <div className="ft-col">
            <h3 className="ft-col-title">Navigate</h3>
            <div className="ft-col-links">
              {[
                { label: "Home", to: "/" },
                { label: "Collection", to: "/product" },
                { label: "Atelier", to: "/product" },
                { label: "Journal", to: "/product" },
              ].map((l) => (
                <Link key={l.label} to={l.to} className="ft-link">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3 — Support */}
          <div className="ft-col">
            <h3 className="ft-col-title">Support</h3>
            <div className="ft-col-links">
              {[
                "Privacy Policy",
                "Terms of Service",
                "Shipping & Returns",
                "Contact Us",
              ].map((l) => (
                <a key={l} href="#" className="ft-link">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Column 4 — Newsletter */}
          <div className="ft-col ft-col--newsletter">
            <h3 className="ft-col-title">The HADI Letter</h3>
            <p className="ft-newsletter-desc">
              Notes on craft, new arrivals, and the art of perfumery.
            </p>
            <div className="ft-newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                className="ft-newsletter-input"
              />
              <button type="button" className="ft-newsletter-btn">
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="ft-legal">
        <span className="ft-legal-copy">
          © 2025 HADI perfumes. All rights reserved.
        </span>
        <span className="ft-legal-craft">Crafted with intention.</span>
      </div>
    </footer>
  );
}
