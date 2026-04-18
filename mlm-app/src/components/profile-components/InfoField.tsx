import type { ChangeEvent } from 'react';

export default function InfoField({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  isEditing?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  [key: string]: any;
}) {
  return (
    <div className="flex flex-row border-b border-white/10 py-4">
      <div className="w-1/3">
        <label className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50">
          {label}
        </label>
      </div>
      <div className="w-2/3">
        {isEditing ? (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className="bg-transparent border-b border-[#c9a96e]/40 focus:border-[#c9a96e] focus:outline-none text-[#e8dcc8] text-sm w-full pb-1 transition-colors duration-500"
          />
        ) : (
          <p className="text-[#e8dcc8] text-sm">{value}</p>
        )}
      </div>
    </div>
  );
}
