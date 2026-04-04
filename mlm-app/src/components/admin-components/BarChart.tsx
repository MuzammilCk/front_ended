export default function BarChart({ data, max, labelKey }) {
  return (
    <div className="flex items-end gap-2 h-[180px]">
      {data.map((d, i) => {
        const pct = (d.orders / max) * 100;
        return (
          <div key={i} className="bar-col">
            <div className="bar-track h-[160px]">
              <div className="bar-fill" style={{ height: `${pct}%` }} />
            </div>
            <span>{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}