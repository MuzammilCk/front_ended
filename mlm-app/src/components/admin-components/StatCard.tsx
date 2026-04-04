export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-[#c9b99a44]">{label}</p>
      <p className="text-3xl fd" style={{ color }}>{value}</p>
      <p className="text-xs text-[#c9b99a33]">{sub}</p>
    </div>
  );
}