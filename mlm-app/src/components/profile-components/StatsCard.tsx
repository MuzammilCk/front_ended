export default function StatsCard({ icon: Icon, value, label }) {
  return (
    <div className="relative overflow-hidden transition-all duration-300 border backdrop-blur-xl bg-white/5 border-white/10 rounded-2xl hover:border-white/20 hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8 text-[#c9a96e]" />
          <span className="text-3xl font-light text-[#e8dcc8]">{value}</span>
        </div>
        <p className="text-sm text-muted/60">{label}</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent" />
    </div>
  );
}