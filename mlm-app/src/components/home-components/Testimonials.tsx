import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { testimonialsData } from "../../data/HomeData";

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

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  const allTestimonials = [...testimonialsData, ...testimonialsData];

  useEffect(() => {
    const marqueeEl = marqueeRef.current;

    const pauseMarquee = () => gsap.globalTimeline.pause();
    const resumeMarquee = () => gsap.globalTimeline.resume();

    const ctx = gsap.context(() => {
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
    }, sectionRef);

    if (marqueeEl) {
      marqueeEl.addEventListener("mouseenter", pauseMarquee);
      marqueeEl.addEventListener("mouseleave", resumeMarquee);
    }

    return () => {
      if (marqueeEl) {
        marqueeEl.removeEventListener("mouseenter", pauseMarquee);
        marqueeEl.removeEventListener("mouseleave", resumeMarquee);
      }
      ctx.revert();
    };
  }, []);

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
