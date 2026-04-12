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
      className={`border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#130e08] p-5
        hover:border-[#c9a96e]/25 transition-colors duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <p className="text-[10px] tracking-[0.22em] uppercase text-muted/25">{label}</p>
      <p className={`font-serif text-3xl font-light mt-2 mb-1 ${COLOR_MAP[color]}`}>{value}</p>
      <div className="flex items-center justify-between">
        {sub && <p className="text-[10px] text-muted/25">{sub}</p>}
        {trend !== undefined && (
          <span className={`text-[9px] tracking-widest ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}