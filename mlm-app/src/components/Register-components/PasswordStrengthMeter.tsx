import { Check } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  const hasLength = password.length >= 8;
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  let strength = 0;
  if (password.length > 0) strength += 1;
  if (password.length >= 8) strength += 1;
  if (hasLength && hasUpper && hasNumber) strength += 1;
  if (hasLength && hasSpecial && hasUpper && hasNumber) strength += 1;

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const currentLabel = password.length === 0 ? "" : strengthLabels[strength - 1];

  const getBarColor = (index: number) => {
    if (index >= strength) return "bg-white/10";
    if (strength <= 2) return "bg-rose-400";
    if (strength === 3) return "bg-amber-400";
    return "bg-[#84cc16]";
  };

  return (
    <div className="mt-4 p-5 rounded-xl bg-[#0a0705] border border-white/5 shadow-inner">
      <p className="text-[13px] text-[#e8dcc8] mb-4 font-medium tracking-wide">
        Your Password must include
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {hasLength ? (
              <Check className="w-4 h-4 text-[#c9a96e]" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-white/20" />
            )}
          </div>
          <span className={`text-[13px] ${hasLength ? "text-white/90" : "text-white/50"}`}>
            At least 8 characters
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {hasSpecial ? (
              <Check className="w-4 h-4 text-[#c9a96e]" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-white/20" />
            )}
          </div>
          <span className={`text-[13px] ${hasSpecial ? "text-white/90" : "text-white/50"}`}>
            At least one special character
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {hasUpper && hasNumber ? (
              <Check className="w-4 h-4 text-[#c9a96e]" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-white/20" />
            )}
          </div>
          <span className={`text-[13px] ${hasUpper && hasNumber ? "text-white/90" : "text-white/50"}`}>
            Uppercase letter and number
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-white/60">Password Strength</span>
        {currentLabel && (
          <span
            className="text-[12px] font-medium"
            style={{ color: strength === 4 ? "#84cc16" : strength === 3 ? "#fbbf24" : "#e8dcc8" }}
          >
            {currentLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 h-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-500 ${getBarColor(index)}`}
          />
        ))}
      </div>
    </div>
  );
}
