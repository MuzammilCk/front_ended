import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useHomepage } from "../../hooks/useHomepage";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_STATS = [
  { value: "12+", label: "Years of craft" },
  { value: "47", label: "Rare ingredients" },
  { value: "3", label: "Continents sourced" },
  { value: "Grasse", label: "Perfume capital, France" },
];

export default function BrandStatement() {
  const { data, loading } = useHomepage();
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const bs = data?.brand_statement;
  const stats = bs?.stats ?? FALLBACK_STATS;
  const headline = bs?.headline ?? "Every bottle holds\na world unto itself";
  const body = bs?.body ??
    "We source the rarest raw ingredients from across the globe — Cambodian oud, Bulgarian rose, Madagascan vanilla — blended by master perfumers with decades of craft.";
  const imageUrl = bs?.image_url ?? "/brand-bg.png";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            eyebrowRef.current,
            headlineRef.current,
            bodyRef.current,
            statsRef.current,
            ctaRef.current,
          ].filter(Boolean),
          { y: 0, opacity: 1 },
        );
        return;
      }

      if (imageRef.current) {
        gsap.to(imageRef.current, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      const textEls = [
        eyebrowRef.current,
        headlineRef.current,
        bodyRef.current,
        statsRef.current,
        ctaRef.current,
      ].filter((el) => el != null) as HTMLElement[];

      gsap.set(textEls, { y: 30, opacity: 0 });
      gsap.to(textEls, {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (loading) {
    return (
      <section className="bs-section">
        <div className="bs-image-panel" aria-hidden>
          <div className="bs-image-inner" style={{ background: '#1a1410' }} />
        </div>
        <div className="bs-content-panel">
          <div className="animate-pulse flex flex-col gap-4 py-12">
            <div className="h-3 w-32 bg-[#c9a96e]/10 rounded" />
            <div className="h-10 w-72 bg-[#c9a96e]/10 rounded" />
            <div className="h-16 w-full bg-[#c9a96e]/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

  // Split headline into two lines for <br /> rendering
  const headlineParts = headline.split('\n');

  return (
    <section ref={sectionRef} className="bs-section">
      {/* Left — image panel */}
      <div className="bs-image-panel" aria-hidden>
        <div
          ref={imageRef}
          className="bs-image-inner"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="bs-image-veil" />
        <span className="bs-vert-label" aria-hidden>
          HADI PERFUMES — EST. 2012
        </span>
      </div>

      {/* Right — content panel */}
      <div className="bs-content-panel">
        <div ref={eyebrowRef} className="bs-eyebrow">
          <span className="bs-eyebrow-line" aria-hidden />
          <span>Maison de Parfum</span>
        </div>

        <h2 ref={headlineRef} className="bs-headline">
          {headlineParts[0]}
          {headlineParts.length > 1 && (
            <>
              <br />
              <em>{headlineParts[1]}</em>
            </>
          )}
        </h2>

        <p ref={bodyRef} className="bs-body">
          {body}
        </p>

        <div ref={statsRef} className="bs-stats">
          {stats.map((s, i) => (
            <div key={i} className="bs-stat">
              <span className="bs-stat-value">{s.value}</span>
              <span className="bs-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <button ref={ctaRef} type="button" className="bs-cta">
          <span>Discover Our Story</span>
          <span className="bs-cta-arrow" aria-hidden>
            →
          </span>
        </button>
      </div>
    </section>
  );
}
