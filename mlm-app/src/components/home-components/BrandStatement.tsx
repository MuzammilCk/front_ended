import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: "12+", label: "Years of craft" },
  { value: "47", label: "Rare ingredients" },
  { value: "3", label: "Continents sourced" },
  { value: "Grasse", label: "Perfume capital, France" },
];

export default function BrandStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

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

  return (
    <section ref={sectionRef} className="bs-section">
      {/* Left — image panel */}
      <div className="bs-image-panel" aria-hidden>
        <div
          ref={imageRef}
          className="bs-image-inner"
          style={{ backgroundImage: "url('/brand-bg.png')" }}
        />
        <div className="bs-image-veil" />
        <span className="bs-vert-label" aria-hidden>
          AURORE PARFUMS — EST. 2012
        </span>
      </div>

      {/* Right — content panel */}
      <div className="bs-content-panel">
        <div ref={eyebrowRef} className="bs-eyebrow">
          <span className="bs-eyebrow-line" aria-hidden />
          <span>Maison de Parfum</span>
        </div>

        <h2 ref={headlineRef} className="bs-headline">
          Every bottle holds
          <br />
          <em>a world unto itself</em>
        </h2>

        <p ref={bodyRef} className="bs-body">
          We source the rarest raw ingredients from across the globe —
          Cambodian oud, Bulgarian rose, Madagascan vanilla — blended by
          master perfumers with decades of craft.
        </p>

        <div ref={statsRef} className="bs-stats">
          {STATS.map((s, i) => (
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
