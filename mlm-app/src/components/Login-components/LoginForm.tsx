import { useState, useRef } from "react";
import { formatPhoneDisplay } from "../../utils/formatPhone";

interface LoginFormProps {
  formData: { identifier: string; password: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function LoginForm({
  formData,
  handleChange,
  handleSubmit,
  isLoading,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={handleSubmit}>
      {/* Smart Identifier Input */}
      <div className="auth-input-group">
        <input
          type="text"
          name="identifier"
          value={formatPhoneDisplay(formData.identifier)}
          onChange={(e) => {
            // Strip formatting spaces before storing in state
            const raw = e.target.value.replace(/\s/g, "");
            handleChange({
              ...e,
              target: { ...e.target, name: "identifier", value: raw },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          className="auth-input"
          placeholder=" "
          required
          autoFocus
          id="login-identifier"
          onKeyDown={(e) => {
            if (e.key === "Enter" && formData.identifier.trim()) {
              e.preventDefault();
              passwordRef.current?.focus();
            }
          }}
        />
        <label htmlFor="login-identifier" className="auth-label">
          Email or Phone Number
        </label>
      </div>

      {/* Password Input */}
      <div className="auth-input-group">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="auth-input"
          placeholder=" "
          required
          id="login-password"
          ref={passwordRef}
          style={{ paddingRight: "3rem" }}
        />
        <label htmlFor="login-password" className="auth-label">
          Password
        </label>
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword(!showPassword)}
          className="auth-password-toggle"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
      </div>

      {/* Forgot Password — right-aligned */}
      <div className="text-right mb-6">
        <button
          type="button"
          className="text-xs text-white/40 hover:text-[#c9a96e] transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      {/* Submit — Edge-to-edge Gold Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="auth-btn-primary"
      >
        <span style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.2s ease",
          position: isLoading ? "absolute" : "static",
        }}>
          Sign In
        </span>
        {isLoading && <div className="auth-btn-spinner" />}
      </button>
    </form>
  );
}
