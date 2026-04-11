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
      await login({ identifier, password: formData.password });
      
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
    <div className="relative min-h-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.4)" }}
      >
        <source src="/assets/auth-bg.webm" type="video/webm" />
        <source src="/assets/auth-bg.mp4" type="video/mp4" />
      </video>

      {/* Floating content */}
      <div className="relative z-10 min-h-screen p-6 text-white">
        <LoginHeader />
        <div className="max-w-md mx-auto">
          <LoginHero />
          <LoginMethodToggle loginMethod={loginMethod} setLoginMethod={setLoginMethod} />
          {apiError && <Alert variant="error" className="mb-4">{apiError}</Alert>}
          {isLoading && <Alert variant="info" className="mb-4 text-center">Signing in…</Alert>}
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
