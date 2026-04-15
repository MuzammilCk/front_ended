import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendOtp, verifyOtp } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import RegisterHeader from "../components/Register-components/RegisterHeader";
import RegisterHero from "../components/Register-components/RegisterHero";
import RegisterForm from "../components/Register-components/RegisterForm";
import RegisterFooter from "../components/Register-components/RegisterFooter";
import { Alert } from "../components/ui/Alert";
import OTPInput from "../components/ui/OTPInput";
import { useCart } from "../context/CartContext";

export default function Register() {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Pre-fill from ?ref= URL param (referral link flow).
    // Falls back to "" so the user can type it manually.
    referralCode: searchParams.get("ref") ?? "",
  });

  const navigate = useNavigate();
  const { signup } = useAuth();
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

  const handleVerify = async (otpValue: string) => {
    setApiError("");
    if (!otpValue.trim() || otpValue.length !== 6) {
      setApiError("Please enter the 6-digit OTP sent to your phone.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyOtp({ phone: formData.phone, otp: otpValue });
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Step 1 — phone submitted → send OTP
    if (step === "form") {
      if (!formData.phone.trim()) {
        setApiError("Phone number is required.");
        return;
      }
      // Guard: referral_code is required by the backend (@IsNotEmpty)
      if (!formData.referralCode.trim()) {
        setApiError("A referral code is required to create an account.");
        return;
      }
      setIsLoading(true);
      try {
        let phoneStr = formData.phone.trim();
        // Auto-prepend +91 if user entered a 10 digit number without country code
        if (!phoneStr.startsWith('+')) {
          phoneStr = phoneStr.length === 10 ? `+91${phoneStr}` : `+${phoneStr}`;
        }

        await sendOtp({ phone: phoneStr });
        // Store the correctly formatted phone back in state so verification uses it
        setFormData((prev) => ({ ...prev, phone: phoneStr }));
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

    // Step 2 — OTP submitted → verify and get session token
    if (step === "otp") {
      return handleVerify(otp);
    }
  };

  useEffect(() => {
    if (step !== "creating" || !sessionToken) return;

    const performSignup = async () => {
      setIsLoading(true);
      setApiError("");
      try {
        // FIX: Only send the accepted fields.
        // phone comes from the JWT session token (Bearer header),
        // not from the request body.
        await signup(
          {
            full_name: formData.name,
            password: formData.password,
            ...(formData.email.trim() ? { email: formData.email.trim() } : {}),
            ...(formData.referralCode.trim() ? { referral_code: formData.referralCode.trim() } : {}),
            attempt_id: "",
          },
          sessionToken,
        );
        setStep("done");
        navigate("/product");
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
  }, [step, sessionToken, formData, signup, navigate]);

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
        <RegisterHeader />

      <div className="max-w-md mx-auto">
        <RegisterHero />

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
            <OTPInput 
              value={otp} 
              onChange={setOtp} 
              disabled={isLoading}
              onComplete={(val) => {
                setOtp(val);
                void handleVerify(val);
              }}
            />
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
              disabled={isLoading}
              className="w-full mt-3 py-2.5 text-sm tracking-widest border border-[#c9a96e] text-[#c9a96e] rounded-lg hover:bg-[#c9a96e] hover:text-black transition disabled:opacity-50"
            >
              {isLoading ? "Verifying…" : "VERIFY OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setApiError("");
              }}
              className="w-full mt-2 py-2 text-xs text-white/40 hover:text-white/60 transition"
            >
              ← Change phone number
            </button>
          </div>
        )}

        {step === "form" && (
          <>
            <div className="mb-6 space-y-3">
              <button
                onClick={() => alert("Google SSO coming soon")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 text-[15px] font-medium tracking-tight rounded-lg bg-white/[0.02] border border-white/10 text-white/90 hover:bg-white/[0.06] hover:text-white transition-all shadow-sm"
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
                className="w-full flex items-center justify-center gap-3 py-2.5 text-[15px] font-medium tracking-tight rounded-lg bg-transparent border border-[#c9a96e]/50 text-[#c9a96e] hover:bg-[#c9a96e]/10 hover:border-[#c9a96e] transition-all shadow-sm"
              >
                Continue as Guest
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">or register with email</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <RegisterForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
            />
          </>
        )}
      </div>

      <RegisterFooter />
      </div>
    </div>
  );
}
