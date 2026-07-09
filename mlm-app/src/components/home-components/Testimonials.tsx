import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useHomepage } from "../../hooks/useHomepage";
import type { HomepageTestimonial } from "../../api/types";
import { useGsapContext } from "../../hooks/useGsapContext";

gsap.registerPlugin(ScrollTrigger);

const StarRow = ({ count = 5 }: { count?: number }) => (
  <div className="tm-stars" aria-label={`${count} stars`}>
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </div>
);

// Fallback data used while API loads or if API fails
const FALLBACK_TESTIMONIALS: HomepageTestimonial[] = [
  {
    text: "HADI fragrances are not just scents — they are memories bottled. The depth and elegance are unmatched.",
    author: "Sophia Laurent",
    location: "Paris, France",
    fragrance: "Noir Absolu",
    rating: 5,
  },
  {
    text: "The oud collection is extraordinary. Long-lasting, rich, and deeply personal. I receive compliments everywhere.",
    author: "Daniel Reed",
    location: "London, UK",
    fragrance: "Oud Majestic",
    rating: 5,
  },
  {
    text: "A perfect balance of art and science. Every fragrance tells a story. Truly a luxury experience.",
    author: "Amira Khan",
    location: "Dubai, UAE",
    fragrance: "Sable Doré",
    rating: 5,
  },
  {
    text: "I layer two of their florals for evenings out — the dry-down is silk on skin. My signature now.",
    author: "Elena Vasquez",
    location: "Barcelona, Spain",
    fragrance: "Rose de Minuit",
    rating: 5,
  },
  {
    text: "The atelier sample set convinced me in one afternoon. Precision, restraint, and real sillage.",
    author: "James Okonkwo",
    location: "Lagos, Nigeria",
    fragrance: "Encens Vérité",
    rating: 5,
  },
  {
    text: "Quiet luxury in a bottle. People ask what I'm wearing — I smile and say it's from HADI.",
    author: "Mei Lin",
    location: "Singapore",
    fragrance: "Brume d'Iris",
    rating: 5,
  },
];

export default function Testimonials() {
  const { data, loading } = useHomepage();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  const testimonialsData = Array.isArray(data?.testimonials) && data!.testimonials.length > 0
    ? data!.testimonials
    : FALLBACK_TESTIMONIALS;
  const allTestimonials = [...testimonialsData, ...testimonialsData];

  useGsapContext(() => {
    if (headerRef.current && sectionRef.current) {
      gsap.from(headerRef.current, {
        y: 24,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
        },
      });
    }

    const inner = marqueeInnerRef.current;
    if (!inner) return;

    const startMarquee = () => {
      const totalWidth = inner.scrollWidth / 2;
      if (totalWidth <= 0) return;
      gsap.to(inner, {
        x: -totalWidth,
        duration: 35,
        ease: "none",
        repeat: -1,
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(startMarquee);
    });
  }, sectionRef, [testimonialsData]);

  useEffect(() => {
    const marqueeEl = marqueeRef.current;

    const pauseMarquee = () => gsap.globalTimeline.pause();
    const resumeMarquee = () => gsap.globalTimeline.resume();

    if (marqueeEl) {
      marqueeEl.addEventListener("mouseenter", pauseMarquee);
      marqueeEl.addEventListener("mouseleave", resumeMarquee);
    }

    return () => {
      if (marqueeEl) {
        marqueeEl.removeEventListener("mouseenter", pauseMarquee);
        marqueeEl.removeEventListener("mouseleave", resumeMarquee);
      }
    };
  }, []);

  if (loading) {
    return (
      <section className="tm-section">
        <div className="tm-header">
          <div className="animate-pulse flex flex-col items-center gap-4 py-12">
            <div className="h-3 w-24 bg-[#c9a96e]/10 rounded" />
            <div className="h-8 w-64 bg-[#c9a96e]/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="tm-section">
      <div ref={headerRef} className="tm-header">
        <div className="tm-eyebrow">
          <span className="tm-eyebrow-line" />
          <span>Client voices</span>
        </div>
        <h2 className="tm-headline">
          What Our <em>Clients Say</em>
        </h2>
        <p className="tm-sub">
          Each fragrance carries a memory. Here are some of theirs.
        </p>
      </div>

      <div ref={marqueeRef} className="tm-marquee-wrap">
        <div className="tm-fade-left" aria-hidden />
        <div className="tm-fade-right" aria-hidden />

        <div ref={marqueeInnerRef} className="tm-marquee-inner">
          {allTestimonials.map((t, i) => (
            <div key={i} className="tm-card">
              <StarRow count={t.rating} />
              <p className="tm-card-text">&ldquo;{t.text}&rdquo;</p>
              <div className="tm-card-footer">
                <div className="tm-card-rule" aria-hidden />
                <div className="tm-card-author-block">
                  <span className="tm-card-author">{t.author}</span>
                  <span className="tm-card-location">{t.location}</span>
                </div>
                <div className="tm-card-fragrance">
                  <span className="tm-card-fragrance-label">Wearing</span>
                  <span className="tm-card-fragrance-name">{t.fragrance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
