import { Link } from "react-router-dom";

export default function LoginHeader() {
  return (
    <header className="flex items-center justify-between mb-12">
      <Link to="/" className="text-2xl tracking-wide font-display">
        HADI
      </Link>
      <Link
        to="/register"
        className="text-sm transition-colors text-white/70 hover:text-white"
      >
        Create Account
      </Link>
    </header>
  );
}
