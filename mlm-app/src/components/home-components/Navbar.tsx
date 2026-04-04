import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6"
      style={{
        background: "linear-gradient(to bottom, #0d0905ee, transparent)",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="font-display text-xl font-light tracking-[0.15em] text-[#e8dcc8]"
      >
        AURORE
      </Link>

      {/* Nav Links */}
      <nav className="flex items-center gap-10">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/product" className="nav-link">
          Collection
        </Link>
        <Link to="/product" className="nav-link">
          Atelier
        </Link>
        <Link to="/product" className="nav-link">
          Journal
        </Link>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <Link to="/login">
          {" "}
          <button className="cursor-pointer nav-link">Login</button>
        </Link>
      </div>
    </header>
  );
}
