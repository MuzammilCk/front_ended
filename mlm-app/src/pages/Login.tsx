import { useState } from "react";
import { sendOtp } from "../api/auth";
import { ApiError } from "../api/client";
import LoginHeader from "../components/Login-components/LoginHeader";
import LoginHero from "../components/Login-components/LoginHero";
import LoginMethodToggle from "../components/Login-components/LoginMethodToggle";
import LoginForm from "../components/Login-components/LoginForm";
import LoginFooter from "../components/Login-components/LoginFooter";
import { Alert } from "../components/ui/Alert";

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    referralCode: "",
  });

  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Phone path — wire sendOtp (backend has no login endpoint yet)
    if (loginMethod === "phone") {
      if (!formData.phone.trim()) {
        setApiError("Phone number is required.");
        return;
      }
      setIsLoading(true);
      try {
        await sendOtp({ phone: formData.phone });
        setOtpSent(true);
      } catch (err) {
        if (err instanceof ApiError) {
          setApiError(err.body || "Failed to send OTP. Please try again.");
        } else {
          setApiError("Network error. Please check your connection.");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Email path — no backend endpoint available yet
    setApiError("Email login is not available yet. Please use phone + OTP.");
  };

  return (
    <div className="min-h-screen p-6 text-white">
      {/* Header */}
      <LoginHeader />

      {/* Login Container */}
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <LoginHero />

        {/* Login Method Toggle */}
        <LoginMethodToggle
          loginMethod={loginMethod}
          setLoginMethod={setLoginMethod}
        />

        {/* API status — inserted between toggle and form */}
        {apiError && (
          <Alert variant="error" className="mb-4">
            {apiError}
          </Alert>
        )}

        {otpSent && (
          <Alert variant="success" className="mb-4">
            OTP sent to {formData.phone}. Use the Register page to complete your account setup.
          </Alert>
        )}

        {isLoading && (
          <Alert variant="info" className="mb-4 text-center">
            Sending OTP…
          </Alert>
        )}

        {/* Login Form */}
        <LoginForm
          loginMethod={loginMethod}
          setLoginMethod={setLoginMethod}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Footer */}
      <LoginFooter />
    </div>
  );
}
