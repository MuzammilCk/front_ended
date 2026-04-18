import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { sendOtp, verifyOtp } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import RegisterHero from "../components/Register-components/RegisterHero";
import RegisterForm from "../components/Register-components/RegisterForm";
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

  // OTP retry tracking — MNC pattern (Amazon/Flipkart)
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  // Resend cooldown timer (30s standard)
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 409 redirect flag — shows message before navigating to login
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      const decoded = jwtDecode<{ name?: string; email?: string }>(credentialResponse.credential);
      setFormData((prev) => ({
        ...prev,
        name: decoded.name || prev.name,
        email: decoded.email || prev.email,
      }));
    } catch (err) {
      console.error("Failed to decode Google token", err);
    }
  };

  // Start resend cooldown timer (30 seconds — MNC standard)
  const startResendCooldown = useCallback(() => {
    setResendCooldown(30);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setApiError("");
    setOtp("");
    setOtpAttempts(0);
    setRemainingAttempts(5);
    setIsLoading(true);
    try {
      await sendOtp({ phone: formData.phone });
      startResendCooldown();
      setApiError(""); // Clear any previous errors
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.body || "Failed to resend OTP.");
      } else {
        setApiError("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
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
      // Success — proceed to signup
      setOtpAttempts(0);
      setSessionToken(result.session_token);
      setStep("creating");
    } catch (err) {
      // CRITICAL: Stay on OTP step — NEVER redirect on wrong OTP.
      // Clear the OTP input so the user can retype cleanly.
      setOtp("");
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      if (err instanceof ApiError) {
        // Parse remaining_attempts from structured backend response
        try {
          // The body might be the raw message (already parsed by client.ts),
          // or it might contain JSON with remaining_attempts
          const bodyStr = err.body;
          // Check if it contains structured info
          if (bodyStr.includes('remaining')) {
            setApiError(bodyStr);
          } else {
            const remaining = Math.max(0, 5 - newAttempts);
            setRemainingAttempts(remaining);
            if (remaining === 0) {
              setApiError("Too many failed attempts. Please request a new OTP.");
            } else {
              setApiError(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
            }
          }
        } catch {
          setApiError(err.body || "Invalid or expired OTP.");
        }
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
        setOtpAttempts(0);
        setRemainingAttempts(5);
        startResendCooldown();
        setStep("otp");
      } catch (err) {
        if (err instanceof ApiError) {
          // Handle 409 — user already has an account
          if (err.status === 409) {
            setShowLoginRedirect(true);
            setApiError("An account with this phone number already exists.");
            setTimeout(() => navigate("/login"), 3000);
          } else {
            setApiError(err.body || "Failed to send OTP. Please try again.");
          }
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
      <div className="relative z-10 min-h-screen p-6 text-white flex flex-col justify-between">
        {/* BRAND HEADER */}
        <header className="flex items-center justify-center w-full py-4">
          <Link to="/" className="text-3xl tracking-widest font-display text-[#e8dcc8]">
            HADI
          </Link>
        </header>

        {/* MAIN CONTENT */}
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <RegisterHero />

        {apiError && (
          <Alert variant="error" className="anim-rise mb-4">
            {apiError}
            {showLoginRedirect && (
              <span className="block mt-1 text-xs">
                Redirecting to login page…{" "}
                <Link to="/login" className="underline text-[#c9a96e]">
                  Go now
                </Link>
              </span>
            )}
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

            {/* Resend OTP + cooldown timer — MNC standard (30s cooldown) */}
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCooldown > 0}
                className="text-xs text-[#c9a96e]/70 hover:text-[#c9a96e] transition disabled:text-white/20 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
              {otpAttempts > 0 && remainingAttempts > 0 && (
                <span className="text-xs text-amber-400/80">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} left
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setOtpAttempts(0);
                setRemainingAttempts(5);
                setApiError("");
              }}
              className="w-full mt-4 py-2 text-label text-white/40 hover:text-white/60 transition"
            >
              ← Change phone number
            </button>
          </div>
        )}

        {step === "form" && (
          <>
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
                className="w-full btn-secondary px-0 border border-sand/50 text-sand hover:text-white"
              >
                Continue as Guest
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-label text-zinc-500">or register with email</span>
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

        {/* CONSOLIDATED FOOTER */}
        <div className="w-full text-center pb-6 mt-8">
          <p className="text-sm text-white/50">
            Already have an account?{" "}
            <Link to="/login" className="text-[#c9a96e] hover:text-white transition-colors font-medium tracking-wide">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
