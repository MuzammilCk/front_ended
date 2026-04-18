import { useState } from "react";
import { Check } from "lucide-react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

interface RegisterFormProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function RegisterForm({
  formData,
  handleChange,
  handleSubmit,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const pw = formData.password;
  const meetsLength = pw.length >= 8;
  const meetsUppercase = /[A-Z]/.test(pw);
  const meetsNumber = /[0-9]/.test(pw);
  const meetsSymbol = /[^A-Za-z0-9]/.test(pw);

  const isPasswordValid = meetsLength && meetsUppercase && meetsNumber && meetsSymbol;

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.phone &&
    isPasswordValid &&
    formData.referralCode &&
    passwordsMatch &&
    agreeToTerms;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-sm p-8 shadow-glass">
      {/* Full Name */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border border-white/10 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
          placeholder="John Doe"
          required
        />
      </div>

      {/* Email Address */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border border-white/10 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
          placeholder="hello@aurora.com"
          required
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border border-white/10 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
          placeholder="+1 234 567 8900"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border border-white/10 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 focus:bg-white/[0.05] focus:outline-none transition-all pr-10 placeholder:text-zinc-600"
            placeholder="Create a strong password"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute -translate-y-1/2 right-3 top-1/2 text-white/40 hover:text-white/60"
          >
            {showPassword ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Password Requirements */}
      <PasswordStrengthMeter password={formData.password} />


      {/* Confirm Password */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border ${formData.confirmPassword && !passwordsMatch
              ? "border-red-500/50 focus:ring-red-500/20"
              : "border-white/10 focus:border-[#c9a96e] focus:ring-[#c9a96e]/20"
              } focus:ring-1 focus:bg-white/[0.05] focus:outline-none transition-all pr-10 placeholder:text-zinc-600`}
            placeholder="Confirm your password"
            required
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            aria-pressed={showConfirmPassword}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute -translate-y-1/2 right-3 top-1/2 text-white/40 hover:text-white/60"
          >
            {showConfirmPassword ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
        {formData.confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      {/* Referral Code (Required) */}
      <div>
        <label className="block mb-2 text-label text-zinc-400">
          Referral Code <span className="text-xs text-[#c9a96e]">(Required)</span>
        </label>
        <input
          type="text"
          name="referralCode"
          value={formData.referralCode}
          onChange={handleChange}
          className="w-full px-4 py-3 text-[15px] rounded-sm bg-white/[0.02] border border-white/10 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
          placeholder="Enter referral code"
        />
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-white/10 bg-white/[0.02] text-[#c9a96e] focus:ring-white/20 focus:ring-1 transition-colors"
        />
        <label htmlFor="terms" className="text-[13px] text-zinc-400 leading-relaxed">
          I agree to the{" "}
          <button
            type="button"
            className="underline transition-colors text-zinc-300 hover:text-white"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="underline transition-colors text-zinc-300 hover:text-white"
          >
            Privacy Policy
          </button>
        </label>
      </div>



      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid}
        className={`w-full py-3.5 text-[14px] uppercase tracking-widest rounded-sm font-medium transition-all ${isFormValid
          ? "btn-primary hover:text-white"
          : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
          }`}
      >
        Create Account
      </button>
    </form>
  );
}
