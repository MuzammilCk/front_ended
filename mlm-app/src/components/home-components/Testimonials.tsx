import { testimonialsData } from "../../data/HomeData";

export default function Testimonials() {
  return (
    <section className="px-12 py-32">
      <div className="mx-auto text-center max-w-7xl">
        {/* Section Header */}
        <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase font-light mb-4">
          Testimonials
        </p>

        <h2 className="font-display text-5xl font-light text-[#e8dcc8] mb-16">
          What Our <em>Clients Say</em>
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-8">
          {testimonialsData.map((t, index) => (
            <div
              key={index}
              className="p-8 border border-[#c9a96e18] bg-[#0d0905] relative group hover:border-[#c9a96e44] transition"
            >
              <p className="text-[#c9b99a88] text-sm leading-relaxed mb-6 italic">
                {t.text}
              </p>

              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-[1px] bg-[#c9a96e]" />
                <span className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase">
                  {t.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
