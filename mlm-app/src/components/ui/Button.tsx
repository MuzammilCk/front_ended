import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solidGold" | "outlineGold" | "ghost";

const variantClassName: Record<Variant, string> = {
  solidGold:
    "bg-[#c9a96e] text-[#0a0705] hover:bg-[#c9a96e]/90",
  outlineGold:
    "border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0705]",
  ghost:
    "text-white/40 hover:text-white/60",
};

export function Button({
  variant = "outlineGold",
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`motion-press transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0705] ${variantClassName[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

