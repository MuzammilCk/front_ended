import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, getUserRole } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import LoginHeader from "../components/Login-components/LoginHeader";
import LoginHero from "../components/Login-components/LoginHero";
import LoginMethodToggle from "../components/Login-components/LoginMethodToggle";
import LoginForm from "../components/Login-components/LoginForm";
import LoginFooter from "../components/Login-components/LoginFooter";
import { Alert } from "../components/ui/Alert";
import { useCart } from "../context/CartContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const identifier = loginMethod === "phone" ? formData.phone.trim() : formData.email.trim();

    if (!identifier) {
      setApiError(loginMethod === "phone" ? "Phone number is required." : "Email is required.");
      return;
    }
    if (!formData.password) {
      setApiError("Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      let submitIdentifier = identifier;
      if (loginMethod === "phone" && !submitIdentifier.startsWith('+')) {
        submitIdentifier = submitIdentifier.length === 10 ? `+91${submitIdentifier}` : `+${submitIdentifier}`;
      }

      await login({ identifier: submitIdentifier, password: formData.password });
      
      const role = getUserRole();
      if (role === "admin" || role === "content_manager") {
        navigate("/admin");
      } else {
        navigate("/product");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.body || "Invalid credentials. Please try again.");
      } else {
        setApiError("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          backgroundImage: "url('/assets/auth-bg.webp')", 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }} 
      />
      <div 
        className="absolute inset-0" 
        style={{ backgroundImage: "linear-gradient(135deg, #0a0705ee, #1a140fee)" }} 
      />

      {/* Floating content */}
      <div className="relative z-10 min-h-screen p-6 text-white">
        <LoginHeader />
        <div className="max-w-md mx-auto">
          <LoginHero />
          <LoginMethodToggle loginMethod={loginMethod} setLoginMethod={setLoginMethod} />
          {apiError && <Alert variant="error" className="mb-4">{apiError}</Alert>}
          {isLoading && <Alert variant="info" className="mb-4 text-center">Signing in…</Alert>}
          
          <div className="mb-6 space-y-3">
            <button
              onClick={() => alert("Google SSO coming soon")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-white hover:bg-[#222] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            
            <button
              onClick={() => {
                navigate("/");
              }}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-transparent border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40 uppercase tracking-wider">or with {loginMethod}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <LoginForm
            loginMethod={loginMethod}
            setLoginMethod={setLoginMethod}
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
        <LoginFooter />
      </div>
    </div>
  );
}
