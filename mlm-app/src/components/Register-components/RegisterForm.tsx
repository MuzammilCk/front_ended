import { useState, useEffect } from "react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { formatPhoneDisplay } from "../../utils/formatPhone";

interface RegisterFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    referralCode: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  currentStep: number; // 1, 2, or 3
  onNextStep: () => void;
  onPrevStep: () => void;
  isLoading: boolean;
}

export default function RegisterForm({
  formData,
  handleChange,
  handleSubmit,
  currentStep,
  onNextStep,
  onPrevStep,
  isLoading,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Auto-focus the first input of each step
  useEffect(() => {
    // Small delay to allow GSAP slide animation to complete
    const timer = setTimeout(() => {
      const ids: Record<number, string> = {
        1: "register-name",
        2: "register-password",
        3: "register-access-code",
      };
      const el = document.getElementById(ids[currentStep] || "");
      if (el) el.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const pw = formData.password;
  const meetsLength = pw.length >= 8;
  const meetsUppercase = /[A-Z]/.test(pw);
  const meetsNumber = /[0-9]/.test(pw);
  const meetsSymbol = /[^A-Za-z0-9]/.test(pw);
  const isPasswordValid = meetsLength && meetsUppercase && meetsNumber && meetsSymbol;

  // Eye icon SVGs (shared by both password fields)
  const EyeOpen = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeClosed = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  /* ─── Step 1: Identity ─── */
  if (currentStep === 1) {
    return (
      <div>
        {/* Full Name */}
        <div className="auth-input-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="auth-input"
            placeholder=" "
            required
            autoFocus
            id="register-name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && formData.name.trim()) {
                e.preventDefault();
                document.getElementById("register-email")?.focus();
              }
            }}
          />
          <label htmlFor="register-name" className="auth-label">Full Name</label>
        </div>

        {/* Phone Number */}
        <div className="auth-input-group">
          <input
            type="tel"
            name="phone"
            value={formatPhoneDisplay(formData.phone)}
            onChange={(e) => {
              // Strip formatting spaces before storing in state
              const raw = e.target.value.replace(/\s/g, "");
              handleChange({
                ...e,
                target: { ...e.target, name: "phone", value: raw },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
            className="auth-input"
            placeholder=" "
            required
            id="register-phone"
            onKeyDown={(e) => {
              if (e.key === "Enter" && formData.phone.trim()) {
                e.preventDefault();
                onNextStep();
              }
            }}
          />
          <label htmlFor="register-phone" className="auth-label">Phone Number</label>
        </div>

        {/* Email Address */}
        <div className="auth-input-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="auth-input"
            placeholder=" "
            required
            id="register-email"
            onKeyDown={(e) => {
              if (e.key === "Enter" && formData.email.trim()) {
                e.preventDefault();
                document.getElementById("register-phone")?.focus();
              }
            }}
          />
          <label htmlFor="register-email" className="auth-label">Email Address</label>
        </div>

        <button type="button" onClick={onNextStep} className="auth-btn-primary mt-2">
          Continue
        </button>
      </div>
    );
  }

  /* ─── Step 2: Security ─── */
  if (currentStep === 2) {
    return (
      <div>
        {/* Password */}
        <div className="auth-input-group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="auth-input"
            placeholder=" "
            required
            autoFocus
            id="register-password"
            style={{ paddingRight: "3rem" }}
          />
          <label htmlFor="register-password" className="auth-label">Password</label>
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
            className="auth-password-toggle"
          >
            {showPassword ? EyeOpen : EyeClosed}
          </button>
        </div>

        {/* Password Strength Meter */}
        <PasswordStrengthMeter password={formData.password} />

        {/* Confirm Password */}
        <div className="auth-input-group mt-5">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="auth-input"
            placeholder=" "
            required
            id="register-confirm-password"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isPasswordValid && passwordsMatch) {
                e.preventDefault();
                onNextStep();
              }
            }}
            style={{
              paddingRight: "3rem",
              borderColor: formData.confirmPassword && !passwordsMatch
                ? "rgba(244, 63, 94, 0.5)"
                : undefined,
            }}
          />
          <label htmlFor="register-confirm-password" className="auth-label">
            Confirm Password
          </label>
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="auth-password-toggle"
          >
            {showConfirmPassword ? EyeOpen : EyeClosed}
          </button>
        </div>
        {formData.confirmPassword && !passwordsMatch && (
          <p className="mt-1 mb-2 text-xs text-rose-400">Passwords do not match</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onPrevStep}
            className="flex-1 h-[3.25rem] rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onNextStep}
            disabled={!isPasswordValid || !passwordsMatch}
            className="flex-[2] auth-btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ─── Step 3: The Key ─── */
  return (
    <form onSubmit={handleSubmit}>
      {/* Atelier Access Code */}
      <div className="auth-input-group">
        <input
          type="text"
          name="referralCode"
          value={formData.referralCode}
          onChange={handleChange}
          className="auth-input"
          placeholder=" "
          required
          autoFocus
          id="register-access-code"
        />
        <label htmlFor="register-access-code" className="auth-label">
          Atelier Access Code
        </label>
        <p className="mt-1 text-xs text-[#c9a96e]/60">Required — your exclusive invitation code</p>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start gap-3 mt-4 mb-6">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-white/10 bg-white/[0.02] text-[#c9a96e] focus:ring-white/20 focus:ring-1 transition-colors accent-[#c9a96e]"
        />
        <label htmlFor="terms" className="text-[13px] text-zinc-400 leading-relaxed">
          I agree to the{" "}
          <button type="button" className="underline transition-colors text-zinc-300 hover:text-white">
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" className="underline transition-colors text-zinc-300 hover:text-white">
            Privacy Policy
          </button>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrevStep}
          className="flex-1 h-[3.25rem] rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!formData.referralCode.trim() || !agreeToTerms || isLoading}
          className="flex-[2] auth-btn-primary"
        >
          <span style={{
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.2s ease",
            position: isLoading ? "absolute" : "static",
          }}>
            Create Account
          </span>
          {isLoading && <div className="auth-btn-spinner" />}
        </button>
      </div>
    </form>
  );
}
