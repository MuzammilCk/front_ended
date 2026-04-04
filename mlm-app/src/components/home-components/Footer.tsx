import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="py-12 px-12 border-t border-[#c9a96e18]">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <span className="font-display text-lg font-light tracking-[0.15em] text-[#e8dcc8]">
          AURORE
        </span>
        <p className="text-[#c9b99a33] text-xs tracking-wider">
          © 2025 Aurore Parfums. All rights reserved.
        </p>
        <div className="flex gap-8">
          <Link to="/" className="nav-link">
            Privacy
          </Link>
          <Link to="/" className="nav-link">
            Terms
          </Link>
          <Link to="/" className="nav-link">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
