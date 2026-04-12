export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-[#ddcca844]">{label}</p>
      <p className="text-3xl fd" style={{ color }}>{value}</p>
      <p className="text-xs text-[#ddcca833]">{sub}</p>
    </div>
  );
}