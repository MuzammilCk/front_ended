import { Link } from "react-router-dom";
import { products } from "../../data/products";

export default function FeaturedCollection() {
  return (
    <section className="bg-[#0d0905] px-12 pt-12 pb-24 md:pt-16 md:pb-28">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase font-light mb-3">
              Our Signature
            </p>
            <h2 className="font-display text-5xl font-light text-[#e8dcc8]">
              Featured <em>Fragrances</em>
            </h2>
          </div>
          <Link to="/product" className="nav-link">
            View all collection →
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-6">
          {products.slice(0, 3).map((item) => (
            <Link
              to="/product"
              key={item.id}
              className={`card-hover group block relative overflow-hidden`}
            >
              {/* IMAGE AREA */}
              <div className="relative aspect-[3/4] overflow-hidden">
                {/* 🔥 REAL IMAGE */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />

                {/* Overlay (keep luxury look) */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Glow effect */}
                <div
                  className="absolute inset-0 transition duration-700 opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 60%, #c9a96e18 0%, transparent 70%)",
                  }}
                />

                {/* Badge */}
                {item.badge && (
                  <div className="absolute top-4 left-4">
                    <span className="text-[#c9a96e] text-xs tracking-[0.2em] uppercase border border-[#c9a96e44] px-3 py-1">
                      {item.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* INFO */}
              <div className="p-5 border border-[#c9a96e18] border-t-0">
                <p className="text-[#c9a96e66] text-xs tracking-[0.2em] uppercase font-light mb-1">
                  {item.type}
                </p>

                <h3 className="font-display text-2xl font-light text-[#e8dcc8] mb-1">
                  {item.name}
                </h3>

                <p className="text-[#c9b99a66] text-xs font-light mb-4">
                  {item.notes}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[#c9a96e] font-light tracking-wide">
                    AED {item.price}
                  </span>

                  <span className="text-[#c9b99a44] text-xs tracking-widest group-hover:text-[#c9a96e] transition-colors">
                    ADD →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
