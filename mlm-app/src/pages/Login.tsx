import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { ApiError, getUserRole } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { googleLogin } from "../api/auth";
import LoginForm from "../components/Login-components/LoginForm";
import gsap from "gsap";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Refs for GSAP animations
  const editorialImageRef = useRef<HTMLImageElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  // "Slow Reveal" animation — image scales 1.1 → 1.0, form fades in
  useEffect(() => {
    if (editorialImageRef.current) {
      gsap.to(editorialImageRef.current, {
        scale: 1,
        duration: 2,
        ease: "power2.out",
      });
    }
    if (formPanelRef.current) {
      gsap.fromTo(
        formPanelRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const identifier = formData.identifier.replace(/\s/g, "").trim();
    if (!identifier) {
      setApiError("Email or phone number is required.");
      return;
    }
    if (!formData.password) {
      setApiError("Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      let submitIdentifier = identifier;
      // Auto-prepend country code for bare 10-digit numbers
      if (/^\d{10}$/.test(submitIdentifier)) {
        submitIdentifier = `+91${submitIdentifier}`;
      } else if (/^\d+$/.test(submitIdentifier) && !submitIdentifier.startsWith('+')) {
        submitIdentifier = `+${submitIdentifier}`;
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
    <div className="auth-layout">
      {/* LEFT — Editorial Image Panel (desktop only) */}
      <div className="auth-editorial">
        <img
          ref={editorialImageRef}
          src="/assets/auth-bg.png"
          alt="Luxury perfume editorial"
          className="auth-editorial__image"
        />
        <div className="auth-editorial__overlay" />
        <div className="auth-editorial__quote">
          "Wear a story. Leave a memory."
          <span className="auth-editorial__quote-attribution">
            — Hadi Perfumes
          </span>
        </div>
      </div>



      {/* RIGHT — Form Panel */}
      <div className="auth-form-panel">
        <div ref={formPanelRef} className="auth-form-wrapper" style={{ opacity: 0 }}>
          {/* Brand mark */}
          <Link to="/" className="block text-center mb-10">
            <span className="text-3xl tracking-widest font-display text-[#e8dcc8]">
              HADI
            </span>
          </Link>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-display text-3xl text-white/90 mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Sign in to continue your fragrance journey
            </p>
          </div>

          {/* Google SSO — Full width */}
          <div className="w-full flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError("Google Sign-In was unsuccessful. Try again.")}
              theme="filled_black"
              shape="rectangular"
              width="440"
              text="continue_with"
            />
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider__line" />
            <span className="auth-divider__text">or</span>
            <div className="auth-divider__line" />
          </div>

          {/* Error Alert */}
          {apiError && <div className="auth-error-toast" key={apiError}>{apiError}</div>}

          {/* Login Form */}
          <LoginForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-white/50">
              New to HADI?{" "}
              <Link
                to="/register"
                className="text-[#c9a96e] hover:text-white transition-colors font-medium tracking-wide"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
