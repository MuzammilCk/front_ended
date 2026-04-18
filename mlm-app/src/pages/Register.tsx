import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { sendOtp, verifyOtp } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import RegisterForm from "../components/Register-components/RegisterForm";
import OTPInput from "../components/ui/OTPInput";
import gsap from "gsap";

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
  type FlowStep = "form" | "otp" | "creating" | "done";
  const [flowStep, setFlowStep] = useState<FlowStep>("form");
  const [registerStep, setRegisterStep] = useState(1); // 1, 2, or 3
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

  // Refs for GSAP animations
  const editorialImageRef = useRef<HTMLImageElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const otpContentRef = useRef<HTMLDivElement>(null);

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

  // GSAP slide animation for step transitions
  const animateStepTransition = useCallback((direction: "forward" | "backward") => {
    if (!stepContentRef.current) return;
    const el = stepContentRef.current;
    const xOut = direction === "forward" ? -50 : 50;
    const xIn = direction === "forward" ? 50 : -50;

    gsap.to(el, {
      x: xOut,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        gsap.fromTo(
          el,
          { x: xIn, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      },
    });
  }, []);

  // GSAP slide animation for form ↔ OTP transitions
  const animateToOtp = useCallback(() => {
    const formEl = stepContentRef.current;
    if (formEl) {
      gsap.to(formEl, {
        x: -50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setFlowStep("otp");
          // Animate OTP in after React renders it (next tick)
          requestAnimationFrame(() => {
            if (otpContentRef.current) {
              gsap.fromTo(
                otpContentRef.current,
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
              );
            }
          });
        },
      });
    } else {
      setFlowStep("otp");
    }
  }, []);

  const animateBackToForm = useCallback(() => {
    const otpEl = otpContentRef.current;
    if (otpEl) {
      gsap.to(otpEl, {
        x: 50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setFlowStep("form");
          setOtp("");
          setOtpAttempts(0);
          setRemainingAttempts(5);
          setApiError("");
          // Animate form back in after React renders it (next tick)
          requestAnimationFrame(() => {
            if (stepContentRef.current) {
              gsap.fromTo(
                stepContentRef.current,
                { x: -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
              );
            }
          });
        },
      });
    } else {
      setFlowStep("form");
      setOtp("");
      setOtpAttempts(0);
      setRemainingAttempts(5);
      setApiError("");
    }
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
      setFlowStep("creating");
    } catch (err) {
      // CRITICAL: Stay on OTP step — NEVER redirect on wrong OTP.
      // Clear the OTP input so the user can retype cleanly.
      setOtp("");
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      if (err instanceof ApiError) {
        // Parse remaining_attempts from structured backend response
        try {
          const bodyStr = err.body;
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

  // Step navigation with validation
  const handleNextStep = () => {
    setApiError("");
    if (registerStep === 1) {
      if (!formData.name.trim()) {
        setApiError("Full name is required.");
        return;
      }
      if (!formData.email.trim()) {
        setApiError("Email address is required.");
        return;
      }
      if (!formData.phone.trim()) {
        setApiError("Phone number is required.");
        return;
      }
      animateStepTransition("forward");
      setTimeout(() => setRegisterStep(2), 200);
    } else if (registerStep === 2) {
      const pw = formData.password;
      const valid = pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
      if (!valid) {
        setApiError("Password does not meet the strength requirements.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setApiError("Passwords do not match.");
        return;
      }
      animateStepTransition("forward");
      setTimeout(() => setRegisterStep(3), 200);
    }
  };

  const handlePrevStep = () => {
    setApiError("");
    if (registerStep > 1) {
      animateStepTransition("backward");
      setTimeout(() => setRegisterStep(registerStep - 1), 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Final form step → send OTP
    if (flowStep === "form") {
      if (!formData.phone.trim()) {
        setApiError("Phone number is required.");
        return;
      }
      // Guard: referral_code is required by the backend (@IsNotEmpty)
      if (!formData.referralCode.trim()) {
        setApiError("An Atelier Access Code is required to create an account.");
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
        animateToOtp();
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

    // OTP step → verify
    if (flowStep === "otp") {
      return handleVerify(otp);
    }
  };

  useEffect(() => {
    if (flowStep !== "creating" || !sessionToken) return;

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
        setFlowStep("done");
        navigate("/product");
      } catch (err) {
        if (err instanceof ApiError) {
          setApiError(
            err.body || "Account creation failed. Please start over.",
          );
        } else {
          setApiError("Network error. Please check your connection.");
        }
        setFlowStep("form");
      } finally {
        setIsLoading(false);
      }
    };

    void performSignup();
  }, [flowStep, sessionToken, formData, signup, navigate]);

  // Step headings
  const stepHeadings: Record<number, { title: string; subtitle: string }> = {
    1: { title: "Create Account", subtitle: "Join HADI and discover your signature scent" },
    2: { title: "Secure Your Account", subtitle: "Create a strong password to protect your account" },
    3: { title: "Almost There", subtitle: "Enter your exclusive access code to complete registration" },
  };

  const currentHeading = stepHeadings[registerStep] || stepHeadings[1];

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
          "Fragrance is the voice of inanimate things."
          <span className="auth-editorial__quote-attribution">
            — Mary Webb
          </span>
        </div>
      </div>



      {/* RIGHT — Form Panel */}
      <div className="auth-form-panel">
        <div ref={formPanelRef} className="auth-form-wrapper" style={{ opacity: 0 }}>
          {/* Brand mark */}
          <Link to="/" className="block text-center mb-8">
            <span className="text-3xl tracking-widest font-display text-[#e8dcc8]">
              HADI
            </span>
          </Link>

          {/* Step dots indicator — 4 steps: Identity → Security → Access Code → Verify */}
          {(flowStep === "form" || flowStep === "otp") && (
            <div className="auth-step-dots">
              {[1, 2, 3, 4].map((s) => {
                const activeStep = flowStep === "otp" ? 4 : registerStep;
                return (
                  <div
                    key={s}
                    className={`auth-step-dot ${s === activeStep
                      ? "auth-step-dot--active"
                      : s < activeStep
                        ? "auth-step-dot--completed"
                        : ""
                      }`}
                  />
                );
              })}
            </div>
          )}

          {/* Heading — changes per step */}
          {flowStep === "form" && (
            <div className="text-center mb-8">
              <h1 className="text-display text-3xl text-white/90 mb-2">
                {currentHeading.title}
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {currentHeading.subtitle}
              </p>
            </div>
          )}

          {/* Google SSO — only on Step 1 */}
          {flowStep === "form" && registerStep === 1 && (
            <>
              <div className="w-full flex justify-center mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setApiError("Google Sign-In was unsuccessful. Try again.");
                  }}
                  theme="filled_black"
                  shape="rectangular"
                  width="440"
                  text="continue_with"
                />
              </div>

              <div className="auth-divider">
                <div className="auth-divider__line" />
                <span className="auth-divider__text">or</span>
                <div className="auth-divider__line" />
              </div>
            </>
          )}

          {/* Error Alert */}
          {apiError && (
            <div className="auth-error-toast" key={apiError}>
              {apiError}
              {showLoginRedirect && (
                <span className="block mt-1 text-xs">
                  Redirecting to login page…{" "}
                  <Link to="/login" className="underline text-[#c9a96e]">
                    Go now
                  </Link>
                </span>
              )}
            </div>
          )}

          {/* Loading indicator for account creation */}
          {isLoading && flowStep === "creating" && (
            <div className="text-center py-8">
              <div className="auth-btn-spinner mx-auto mb-4" style={{ borderColor: "rgba(201,169,110,0.3)", borderTopColor: "#c9a96e", width: "2rem", height: "2rem" }} />
              <p className="text-sm text-[var(--text-muted)]">Creating your account…</p>
            </div>
          )}

          {/* OTP Step */}
          {flowStep === "otp" && (
            <div ref={otpContentRef} style={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <h1 className="text-display text-3xl text-white/90 mb-2">
                  Verify Phone
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Enter the 6-digit OTP sent to{" "}
                  <span className="text-[#c9a96e]">{formData.phone}</span>
                </p>
              </div>

              <div className="auth-input-group" style={{ marginBottom: "1.5rem", padding: "1.25rem 1rem", borderRadius: "0.5rem", background: "#130e08", border: "1px solid rgba(201, 169, 110, 0.2)" }}>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                  onComplete={(val) => {
                    setOtp(val);
                    void handleVerify(val);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                disabled={isLoading}
                className="auth-btn-primary"
              >
                {isLoading ? <div className="auth-btn-spinner" /> : "VERIFY OTP"}
              </button>

              {/* Resend OTP + cooldown timer */}
              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || resendCooldown > 0}
                  className="text-xs hover:text-[#c9a96e] transition disabled:cursor-not-allowed"
                  style={{ color: resendCooldown > 0 ? "var(--text-muted)" : "rgba(201,169,110,0.7)" }}
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
                onClick={animateBackToForm}
                className="w-full mt-5 py-2 text-label transition"
                style={{ color: "var(--text-muted)" }}
              >
                ← Change phone number
              </button>
            </div>
          )}

          {/* Registration Form Steps */}
          {flowStep === "form" && (
            <div ref={stepContentRef}>
              <RegisterForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                currentStep={registerStep}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-white/50">
              Already have an account?{" "}
              <Link to="/login" className="text-[#c9a96e] hover:text-white transition-colors font-medium tracking-wide">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
