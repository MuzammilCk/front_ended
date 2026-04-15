interface LoginMethodToggleProps {
  loginMethod: "email" | "phone";
  setLoginMethod: (method: "email" | "phone") => void;
}

export default function LoginMethodToggle({
  loginMethod,
  setLoginMethod,
}: LoginMethodToggleProps) {
  return (
    <div className="flex gap-2 mb-6 bg-[#111] p-1 rounded-lg border border-white/10">
      <button
        type="button"
        onClick={() => setLoginMethod("email")}
        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
          loginMethod === "email"
            ? "bg-[#c9a96e] text-black"
            : "text-white/60 hover:text-white"
        }`}
      >
        Email
      </button>
      <button
        type="button"
        onClick={() => setLoginMethod("phone")}
        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
          loginMethod === "phone"
            ? "bg-[#c9a96e] text-black"
            : "text-white/60 hover:text-white"
        }`}
      >
        Phone Number
      </button>
    </div>
  );
}
