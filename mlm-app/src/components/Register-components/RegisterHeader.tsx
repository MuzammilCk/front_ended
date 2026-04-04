import { Link } from "react-router-dom";

export default function RegisterHeader() {
  return (
    <header className="flex items-center justify-between mb-8">
      <Link to="/" className="text-2xl tracking-wide font-display">
        AURORE
      </Link>
      <Link
        to="/login"
        className="text-sm transition-colors text-white/70 hover:text-white"
      >
        Sign In
      </Link>
    </header>
  );
}
