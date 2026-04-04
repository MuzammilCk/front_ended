export default function BrandStatement() {
  return (
    <section className="relative overflow-hidden border-y border-[#c9a96e11] py-28 px-12">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-[#140e08]"
        style={{
          backgroundImage:
            "url('/Perfume_bottle_with_202604041641.jpeg')",
        }}
        role="presentation"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(13, 9, 5, 0.88) 0%, rgba(20, 14, 8, 0.72) 45%, rgba(13, 9, 5, 0.85) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-10 gold-line" style={{ width: "60px" }} />
        <h2 className="font-display text-4xl md:text-6xl font-light italic text-[#e8dcc8] leading-tight mb-8">
          Every bottle holds
          <br />a world unto itself
        </h2>
        <p className="text-[#e8dcc8] font-light text-sm tracking-wide leading-loose max-w-lg mx-auto mb-10">
          We source the rarest raw ingredients from across the globe — Cambodian
          oud, Bulgarian rose, Madagascan vanilla — blended by master perfumers
          with decades of craft.
        </p>
        <button
          type="button"
          className="inline-block border border-[#e8dcc866] px-10 py-[0.85rem] text-[0.6rem] font-normal uppercase tracking-[0.25em] text-[#e8dcc8] transition-colors hover:border-[#e8dcc8] hover:bg-[#e8dcc8]/8"
        >
          Our Story
        </button>
      </div>
    </section>
  );
}
