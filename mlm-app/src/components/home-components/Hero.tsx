import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative flex items-end min-h-screen px-12 pb-24">

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat bg-[#1a1410]"
          style={{ backgroundImage: "url('/hero.jpeg')" }}
          role="presentation"
        />

        <div
          className="absolute rounded-full top-1/4 right-1/4 w-96 h-96 opacity-20"
          style={{ background: "radial-gradient(circle, #c9a96e 0%, transparent 70%)" }}
        />

        <div
          className="absolute w-64 h-64 rounded-full bottom-1/3 left-1/3 opacity-10"
          style={{ background: "radial-gradient(circle, #8b6914 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, #0d0905 0%, #0d0905 11%, rgba(13, 9, 5, 0.78) 28%, rgba(13, 9, 5, 0.28) 48%, rgba(13, 9, 5, 0.06) 66%, transparent 88%)",
          }}
        />
      </div>

      <div className="relative z-10 grid items-end w-full grid-cols-2 gap-16 mx-auto max-w-7xl">
        <div>
          <div className="flex items-center gap-3 mb-8 fade-up">
            <div className="glow-dot" />
            <span className="text-label text-[#c9a96e]">
              New Collection 2025
            </span>
          </div>

          <h1 className="mb-8 text-display hero-title fade-up delay-1 text-[#e8dcc8]">
            The Art <br /><em>of Scent</em>
          </h1>

          <div className="flex items-center gap-6 fade-up delay-2">
            <button className="btn-primary btn-primary-home-specific">
              <span>Explore Now</span>
            </button>
            <Link to="/product" className="flex items-center gap-2 nav-link">
              View All →
            </Link>
          </div>
        </div>

        <div className="text-right fade-up delay-3">
          <p className="font-display italic text-muted text-lg font-light leading-relaxed mb-6">
            "Crafted for those who wear their story on their skin."
          </p>
          <div className="ml-auto gold-line" />
        </div>
      </div>

      <div className="absolute flex flex-col items-center gap-2 -translate-x-1/2 bottom-8 left-1/2 opacity-40">
        <span className="text-label text-muted">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-[#c9a96e] to-transparent" />
      </div>
    </section>
  );
}