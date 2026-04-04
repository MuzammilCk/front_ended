import { Link } from "react-router-dom";

export default function FeaturedCollection({ products }) {
  return (
    <section className="px-12 py-32">
      <div className="mx-auto max-w-7xl">

        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">
              Our Signature
            </p>
            <h2 className="font-display text-5xl text-[#e8dcc8]">
              Featured <em>Fragrances</em>
            </h2>
          </div>
          <Link to="/product" className="nav-link">
            View all collection →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {products.slice(0, 3).map((item) => (
            <Link
              to="/product"
              key={item.id}
              className="relative block overflow-hidden card-hover group"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40" />

                <div
                  className="absolute inset-0 transition opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 60%, #c9a96e18 0%, transparent 70%)",
                  }}
                />
              </div>

              <div className="p-5 border border-[#c9a96e18] border-t-0">
                <h3 className="text-2xl">{item.name}</h3>
                <span className="text-[#c9a96e]">AED {item.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}