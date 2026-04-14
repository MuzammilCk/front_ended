import React from 'react';
import { Check } from 'lucide-react';

export interface CheckoutStepCardProps {
  stepNum: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  summaryText?: string | null;
  onEdit?: () => void;
  children: React.ReactNode;
}

export function CheckoutStepCard({
  stepNum,
  title,
  isActive,
  isCompleted,
  summaryText,
  onEdit,
  children,
}: CheckoutStepCardProps) {
  return (
    <div
      className={`border rounded-xl transition-all duration-300 overflow-hidden ${
        isActive
          ? 'border-[#c9a96e]/30 bg-[#0d0a07] shadow-lg shadow-[#000000]/50'
          : isCompleted
          ? 'border-[#c9a96e]/15 bg-[#0a0705]'
          : 'border-white/5 bg-[#0a0705] opacity-60'
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          isActive ? 'border-b border-[#c9a96e]/10' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors shrink-0 ${
              isCompleted
                ? 'bg-[#c9a96e] text-[#0a0705]'
                : isActive
                ? 'bg-[#c9a96e] text-[#0a0705]'
                : 'border border-white/20 text-white/30'
            }`}
          >
            {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
          </div>
          <div className="flex flex-col">
            <h3
              className={`font-serif text-xl tracking-wide ${
                isActive ? 'text-[#c9a96e]' : isCompleted ? 'text-[#e8dcc8]' : 'text-white/30'
              }`}
            >
              {title}
            </h3>
            {isCompleted && summaryText && (
              <p className="text-sm text-white/50 truncate max-w-[200px] sm:max-w-xs md:max-w-sm mt-0.5">
                {summaryText}
              </p>
            )}
          </div>
        </div>

        {isCompleted && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs uppercase tracking-widest text-[#c9a96e] hover:text-[#e8dcc8] transition px-3 py-1.5 rounded bg-[#c9a96e]/5 hover:bg-[#c9a96e]/10"
          >
            Edit
          </button>
        )}
      </div>

      {isActive && <div className="p-5">{children}</div>}
    </div>
  );
}
