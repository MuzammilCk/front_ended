import type { ReactNode } from "react";

type AlertVariant = "error" | "info" | "warn" | "success";

const variantClassName: Record<AlertVariant, string> = {
  error:
    "bg-red-500/10 border border-red-500/30 text-red-400",
  info:
    "bg-white/5 text-white/60",
  warn:
    "bg-amber-500/10 border border-amber-500/20 text-amber-400",
  success:
    "bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e]",
};

export function Alert({
  variant,
  children,
  className = "",
}: {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`px-4 py-3 rounded-lg text-sm ${variantClassName[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

