export default function InfoField({
  icon: Icon,
  label,
  value,
  isEditing,
  onChange,
  type = "text"
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="w-5 h-5 mt-1 text-[#c9a96e]" />
      <div className="flex-1">
        <p className="text-sm text-muted/60">{label}</p>

        {isEditing ? (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 mt-1 bg-transparent border rounded-lg border-[#c9a96e]/30 text-[#e8dcc8] focus:outline-none focus:border-[#c9a96e]"
          />
        ) : (
          <p className="mt-1 text-[#e8dcc8]">{value}</p>
        )}
      </div>
    </div>
  );
}