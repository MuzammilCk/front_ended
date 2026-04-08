import { Link } from "react-router-dom";

export default function LoginFooter() {
  return (
    <div className="mt-12 pt-6 border-t border-[#222] text-center text-sm text-white/40">
      <p>
        New to HADI perfumes?{" "}
        <Link to="/register" className="text-white/70 hover:text-white">
          Create an account
        </Link>
      </p>
    </div>
  );
}
