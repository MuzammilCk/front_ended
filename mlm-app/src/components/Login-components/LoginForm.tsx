import { useState } from "react";

interface LoginFormProps {
  loginMethod: "email" | "phone";
  setLoginMethod: (method: "email" | "phone") => void;
  formData: any;
  setFormData: (data: any) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  loginMethod,
  setLoginMethod,
  formData,
  setFormData,
  handleChange,
  handleSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      {loginMethod === "email" && (
        <div>
          <label className="block mb-2 text-sm font-medium text-white/80">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-[#111] border border-[#333] focus:border-white/30 focus:outline-none transition-colors"
            placeholder="hello@aurora.com"
            required
          />
        </div>
      )}

      {/* Phone Field */}
      {loginMethod === "phone" && (
        <div>
          <label className="block mb-2 text-sm font-medium text-white/80">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-[#111] border border-[#333] focus:border-white/30 focus:outline-none transition-colors"
            placeholder="+1 234 567 8900"
            required
          />
        </div>
      )}

      {/* Password Field */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white/80">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-[#111] border border-[#333] focus:border-white/30 focus:outline-none transition-colors pr-10"
            placeholder="Enter your password"
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

      {/* Referral Code (Optional) */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white/60">
          Referral Code <span className="text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          name="referralCode"
          value={formData.referralCode}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg bg-[#111] border border-[#333] focus:border-white/30 focus:outline-none transition-colors"
          placeholder="Enter referral code"
        />
      </div>

      {/* Forgot Password */}
      <div className="text-right">
        <button
          type="button"
          className="text-xs transition-colors text-white/50 hover:text-white/70"
        >
          Forgot Password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 font-medium text-black transition-all bg-white rounded-lg hover:bg-white/90"
      >
        Sign In
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#333]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-[#0a0a0a] text-white/40">or</span>
        </div>
      </div>

      {/* Demo Account */}
      <div className="text-center">
        <p className="mb-3 text-xs text-white/40">Demo Credentials</p>
        <div className="flex justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                email: "demo@aurora.com",
                password: "demo123",
              });
              setLoginMethod("email");
            }}
            className="px-3 py-1 rounded bg-[#111] border border-[#333] text-white/60 hover:text-white"
          >
            Email Demo
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                phone: "+1234567890",
                password: "demo123",
              });
              setLoginMethod("phone");
            }}
            className="px-3 py-1 rounded bg-[#111] border border-[#333] text-white/60 hover:text-white"
          >
            Phone Demo
          </button>
        </div>
      </div>
    </form>
  );
}
