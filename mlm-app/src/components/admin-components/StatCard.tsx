import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: 'gold' | 'sky' | 'emerald' | 'rose';
  onClick?: () => void;
}

const COLOR_MAP: Record<NonNullable<StatCardProps['color']>, string> = {
  gold:    'text-[#c9a96e]',
  sky:     'text-sky-400',
  emerald: 'text-emerald-400',
  rose:    'text-rose-400',
};

export default function StatCard({ label, value, sub, trend, color = 'gold', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5 
        transition-all duration-300 hover:border-[#c9a96e]/30 group shadow-md ${onClick ? 'cursor-pointer hover:shadow-black/50 hover:-translate-y-0.5' : ''}`}
    >
      <p className="font-sans text-xs font-medium text-white/50 tracking-wide">{label}</p>
      
      <p className={`font-serif text-[32px] leading-none font-light mt-4 mb-3 ${COLOR_MAP[color]}`}>{value}</p>
      
      <div className="flex items-center justify-between mt-auto">
        {sub && <p className="font-sans text-[10px] text-muted/30">{sub}</p>}
        
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm font-sans text-[9px] font-medium uppercase tracking-widest
            ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            <span className="text-current/60 font-normal ml-1 lowercase tracking-normal">vs last week</span>
          </div>
        )}
      </div>

      {onClick && (
        <span className="absolute top-4 right-4 text-[#c9a96e]/0 group-hover:text-[#c9a96e]/40 transition-colors duration-300 text-sm font-sans">
          →
        </span>
      )}
    </div>
  );
}