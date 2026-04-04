import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp, signup } from "../api/auth";
import { ApiError } from "../api/client";
import RegisterHeader from "../components/Register-components/RegisterHeader";
import RegisterHero from "../components/Register-components/RegisterHero";
import RegisterForm from "../components/Register-components/RegisterForm";
import RegisterFooter from "../components/Register-components/RegisterFooter";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const navigate = useNavigate();
  type RegisterStep = "form" | "otp" | "creating" | "done";
  const [step, setStep] = useState<RegisterStep>("form");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setApiError("");

    // Step 1 — phone is submitted → send OTP
    if (step === "form") {
      if (!formData.phone.trim()) {
        setApiError("Phone number is required.");
        return;
      }
      setIsLoading(true);
      try {
        await sendOtp({ phone: formData.phone });
        setStep("otp");
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

    // Step 2 — OTP is submitted → verify and get session token
    if (step === "otp") {
      if (!otp.trim() || otp.length !== 6) {
        setApiError("Please enter the 6-digit OTP sent to your phone.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await verifyOtp({ phone: formData.phone, otp });
        if (!result.verified) {
          setApiError("OTP verification failed. Please try again.");
          return;
        }
        setSessionToken(result.session_token);
        setStep("creating");
      } catch (err) {
        if (err instanceof ApiError) {
          setApiError(err.body || "Invalid or expired OTP.");
        } else {
          setApiError("Network error. Please check your connection.");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
  };

  useEffect(() => {
    if (step !== "creating" || !sessionToken) return;

    const performSignup = async () => {
      setIsLoading(true);
      setApiError("");
      try {
        await signup(
          {
            phone: formData.phone,
            full_name: formData.name,
            password: formData.password,
            referral_code: formData.referralCode,
            attempt_id: "", // extracted server-side from the session_token JWT
          },
          sessionToken, // passed as Authorization Bearer header
        );
        setStep("done");
        navigate("/");
      } catch (err) {
        if (err instanceof ApiError) {
          setApiError(
            err.body || "Account creation failed. Please start over.",
          );
        } else {
          setApiError("Network error. Please check your connection.");
        }
        setStep("form");
      } finally {
        setIsLoading(false);
      }
    };

    void performSignup();
  }, [step, sessionToken]);

  return (
    <div className="min-h-screen p-6 text-white">
      {/* Header */}
      <RegisterHeader />

      {/* Register Container */}
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <RegisterHero />

        {/* API status messages — inserted between hero and form */}
        {apiError && (
          <Alert variant="error" className="anim-rise mb-4">
            {apiError}
          </Alert>
        )}

        {isLoading && (
          <Alert variant="info" className="anim-rise mb-4 text-center">
            {step === "creating" ? "Creating your account…" : "Please wait…"}
          </Alert>
        )}

        {step === "otp" && (
          <div className="mb-6 px-4 py-5 rounded-lg bg-white/5 border border-[#c9a96e]/20">
            <p className="text-sm text-white/70 mb-3">
              Enter the 6-digit OTP sent to{" "}
              <span className="text-[#c9a96e]">{formData.phone}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-black/40 border border-[#c9a96e]/30 text-[#e8dcc8] rounded-lg focus:outline-none focus:border-[#c9a96e] transition"
            />
            <Button
              type="button"
              onClick={(e) =>
                handleSubmit(e as unknown as React.FormEvent)
              }
              disabled={isLoading}
              variant="outlineGold"
              className="w-full mt-3 py-2.5 text-sm tracking-widest hover:text-black"
            >
              {isLoading ? "Verifying…" : "VERIFY OTP"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setApiError("");
              }}
              variant="ghost"
              className="w-full mt-2 py-2 text-xs"
            >
              ← Change phone number
            </Button>
          </div>
        )}

        {/* Registration Form */}
        <RegisterForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Footer */}
      <RegisterFooter />
    </div>
  );
}
