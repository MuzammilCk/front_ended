import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendOtp, verifyOtp, signup } from "../api/auth";
import { ApiError } from "../api/client";
import RegisterHeader from "../components/Register-components/RegisterHeader";
import RegisterHero from "../components/Register-components/RegisterHero";
import RegisterForm from "../components/Register-components/RegisterForm";
import RegisterFooter from "../components/Register-components/RegisterFooter";
import { Alert } from "../components/ui/Alert";

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

    // Step 2 — OTP submitted → verify and get session token
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
        // FIX: Only send the 3 fields SignupDto accepts.
        // phone and attempt_id come from the JWT session token (Bearer header),
        // not from the request body — sending them causes a 400.
        await signup(
          {
            full_name: formData.name,
            password: formData.password,
            referral_code: formData.referralCode,
          },
          sessionToken,
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
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-black/40 border border-[#c9a96e]/30 text-[#e8dcc8] rounded-lg focus:outline-none focus:border-[#c9a96e] transition"
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

        <RegisterForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>

      <RegisterFooter />
    </div>
  );
}
