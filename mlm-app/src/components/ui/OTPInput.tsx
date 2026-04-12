import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete: (val: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, onComplete, disabled = false }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const formatValue = (val: string) => {
    const arr = val.split("");
    while (arr.length < length) arr.push("");
    return arr.slice(0, length);
  };

  const digits = formatValue(value);

  const handleChange = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return; // numbers only
    
    const newVal = value.split("");
    newVal[i] = char.slice(-1); // Take last char if they quickly type
    const str = newVal.join("").slice(0, length);
    onChange(str);

    if (char && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    }
    if (str.length === length && onComplete) {
      onComplete(str);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        inputsRef.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    if (pasted.length === length && onComplete) {
      onComplete(pasted);
      inputsRef.current[length - 1]?.blur();
    } else {
      inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-medium bg-black/40 border border-[#c9a96e]/30 text-[#e8dcc8] rounded-lg focus:outline-none focus:border-[#c9a96e] transition-colors disabled:opacity-50"
        />
      ))}
    </div>
  );
}
