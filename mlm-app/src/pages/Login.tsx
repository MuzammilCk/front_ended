import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { ApiError, getUserRole } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { googleLogin } from "../api/auth";
import LoginHero from "../components/Login-components/LoginHero";
import LoginMethodToggle from "../components/Login-components/LoginMethodToggle";
import LoginForm from "../components/Login-components/LoginForm";
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

  const [buttonWidth, setButtonWidth] = useState<number>(400);

  useEffect(() => {
    const handleResize = () => {
      // 48px from p-6 on the parent container (24px each side)
      const width = Math.min(400, window.innerWidth - 48);
      setButtonWidth(width);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    
    setApiError("");
    setIsLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      const role = getUserRole();
      if (role === "admin" || role === "content_manager") {
        navigate("/admin");
      } else {
        navigate("/product");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.body || "Google login failed.");
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
      <div className="relative z-10 min-h-screen p-6 text-white flex flex-col justify-between">
        {/* BRAND HEADER */}
        <header className="flex items-center justify-center w-full py-4">
          <Link to="/" className="text-3xl tracking-widest font-display text-[#e8dcc8]">
            HADI
          </Link>
        </header>

        {/* MAIN CONTENT */}
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <LoginHero />
          <LoginMethodToggle loginMethod={loginMethod} setLoginMethod={setLoginMethod} />
          {apiError && <Alert variant="error" className="mb-4">{apiError}</Alert>}
          {isLoading && <Alert variant="info" className="mb-4 text-center">Signing in…</Alert>}
          
          <div className="mb-6 space-y-3 flex flex-col items-center">
            <div className="w-full flex justify-center rounded-lg">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setApiError("Google Sign-In was unsuccessful. Try again.");
                }}
                theme="filled_black"
                shape="rectangular"
                width={String(buttonWidth)}
                text="continue_with"
              />
            </div>
            
            <button
              onClick={() => {
                navigate("/");
              }}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 text-[15px] font-medium tracking-tight rounded-lg bg-transparent border border-[#c9a96e]/50 text-[#c9a96e] hover:bg-[#c9a96e]/10 hover:border-[#c9a96e] transition-all shadow-sm"
            >
              Continue as Guest
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">or with {loginMethod}</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <LoginForm
            loginMethod={loginMethod}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>

        {/* CONSOLIDATED FOOTER */}
        <div className="w-full text-center pb-6 mt-8">
          <p className="text-sm text-white/50">
            New to HADI?{" "}
            <Link to="/register" className="text-[#c9a96e] hover:text-white transition-colors font-medium tracking-wide">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
