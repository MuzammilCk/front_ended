import { Link } from "react-router-dom";

export default function RegisterFooter() {
  return (
    <div className="mt-12 pt-6 border-t border-[#222] text-center text-sm text-white/40">
      <p>
        Already have an account?{" "}
        <Link to="/login" className="text-white/70 hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
