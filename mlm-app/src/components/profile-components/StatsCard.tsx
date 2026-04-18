interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  compact?: boolean; // NEW
}

export default function StatsCard({ label, value, icon: Icon, compact }: StatsCardProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-[#0d0a07] border border-[#c9a96e]/10 rounded-xl text-center">
        <span className="text-lg font-display text-[#e8dcc8]">{value}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted/40 mt-0.5">{label}</span>
      </div>
    );
  }

  return (
    <div style={{ perspective: '800px' }}>
      <div className="relative overflow-hidden transition-all transition-transform duration-300 ease-out border backdrop-blur-xl bg-[#0d0a07] border-[#c9a96e]/10 rounded-2xl hover:border-[#c9a96e]/20 hover:[transform:rotateX(3deg)_rotateY(-3deg)_scale(1.02)]">
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Icon className="w-5 h-5 text-[#c9a96e]/50" strokeWidth={1.5} />
            <span className="text-2xl font-display text-[#e8dcc8]">{value}</span>
          </div>
          <span className="text-left text-[9px] uppercase tracking-widest text-muted/40 mt-2">{label}</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent" />
      </div>
    </div>
  );
}
