import { Link } from "react-router-dom";
import { scentFamilies } from "../../data/HomeData";

export default function NotesExplorer() {
  return (
    <section className="px-12 py-32">
      <div className="grid items-center grid-cols-2 gap-24 mx-auto max-w-7xl">
        <div>
          <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase font-light mb-4">
            Discover by
          </p>
          <h2 className="font-display text-5xl font-light text-[#e8dcc8] mb-10">
            Scent <em>Families</em>
          </h2>
          <div className="space-y-4">
            {scentFamilies.map((s, i) => (
              <Link
                to="/product"
                key={i}
                className="group flex items-center justify-between py-4 border-b border-[#c9a96e18] hover:border-[#c9a96e44] transition-colors"
              >
                <span className="font-display text-xl font-light text-[#e8dcc8] group-hover:text-[#c9a96e] transition-colors">
                  {s.family}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[#c9b99a44] text-xs tracking-widest">
                    {s.count}
                  </span>
                  <span className="text-[#c9a96e] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            className="relative overflow-hidden rounded-none aspect-square img-placeholder"
            style={{
              background: "linear-gradient(135deg, #160e08, #2a1810, #160e08)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 60% 40%, #c9a96e14 0%, transparent 60%)",
              }}
            />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="border border-[#c9a96e22] p-5">
                <p className="text-[#c9a96e] text-xs tracking-[0.2em] uppercase font-light mb-2">
                  Featured Note
                </p>
                <p className="font-display text-2xl font-light text-[#e8dcc8] italic">
                  Oud Cambodi
                </p>
                <p className="text-[#c9b99a66] text-xs font-light mt-1">
                  Sourced from Cambodia's ancient forests
                </p>
              </div>
            </div>
          </div>
          {/* Decorative offset border */}
          <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#c9a96e18] pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
