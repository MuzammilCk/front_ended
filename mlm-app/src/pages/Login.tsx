import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../api/client";
import LoginHeader from "../components/Login-components/LoginHeader";
import LoginHero from "../components/Login-components/LoginHero";
import LoginForm from "../components/Login-components/LoginForm";
import LoginFooter from "../components/Login-components/LoginFooter";
import { Alert } from "../components/ui/Alert";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!formData.phone.trim()) {
      setApiError("Phone number is required.");
      return;
    }
    if (!formData.password.trim()) {
      setApiError("Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      await login({ phone: formData.phone, password: formData.password });
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const parsed = (() => {
          try { return JSON.parse(err.body); } catch { return null; }
        })();
        setApiError(parsed?.message ?? "Invalid phone or password.");
      } else {
        setApiError("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <LoginHeader />
      <div className="max-w-md mx-auto">
        <LoginHero />

        {/* Remove the method toggle — backend only supports phone+password login */}

        {apiError && (
          <Alert variant="error" className="mb-4">{apiError}</Alert>
        )}
        {isLoading && (
          <Alert variant="info" className="mb-4 text-center">Signing in…</Alert>
        )}

        <LoginForm
          loginMethod="phone"
          setLoginMethod={() => {}}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>
      <LoginFooter />
    </div>
  );
}
