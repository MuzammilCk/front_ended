/*
 * FEATURED IMAGES — mlm-app/public/featured/
 * Slots 0–3: add product-1.jpg … or use paths below.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef } from "react";
import { useScrollContext } from "../../lib/scroll";
import "../../styles/FeaturedCollection.css";

gsap.registerPlugin(ScrollTrigger);

const FEATURED_IMAGES: Record<number, string> = {
  0: "/featured/1.png",
  1: "/featured/2.png",
  2: "/featured/2.png",
  3: "/featured/2.png",
  4: "/featured/2.png",
};
const FEATURED_IMAGES_2: Record<number, string> = {
  0: "/featured/holder.png",
  1: "/featured/holder.png",
  2: "/featured/holder.png",
  3: "/featured/holder.png",
  4: "/featured/holder.png",
};
const SLIDE_INDICES = Object.keys(FEATURED_IMAGES)
  .map(Number)
  .sort((a, b) => a - b);

export default function FeaturedCollection() {
  const lenis = useScrollContext();
  const totalSlides = SLIDE_INDICES.length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer2PanelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const slideKeys = useMemo(() => SLIDE_INDICES, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion || !lenis) return;

    const wrapper = wrapperRef.current;
    const section = sectionRef.current;
    const layer1 = layer1Ref.current;

    if (!wrapper || !section || !layer1) return;

    section.style.setProperty("--fc-slide-count", String(totalSlides));

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length && lenis) {
          lenis.scrollTo(value as number);
        }
        return lenis.scroll ?? window.scrollY;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const slideWidth = window.innerWidth;
    const scrollSpan = slideWidth * Math.max(0, totalSlides - 1);

    const syncLayer2AndDots = (progress: number) => {
      const denom = Math.max(1, totalSlides - 1);
      const exactSlide = progress * denom;
      layer2PanelsRef.current.forEach((panel, i) => {
        if (!panel) return;
        const dist = Math.abs(exactSlide - i);
        const opacity = Math.max(0, 1 - dist);
        gsap.set(panel, { opacity });
      });
      const activeDot = Math.max(
        0,
        Math.min(totalSlides - 1, Math.round(exactSlide)),
      );
      dotRefs.current.forEach((dot, i) => {
        dot?.classList.toggle("fc-dot--active", i === activeDot);
      });
    };

    const ctx = gsap.context(() => {
      gsap.to(layer1, {
        x: -scrollSpan,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${scrollSpan}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            syncLayer2AndDots(self.progress);
          },
          onRefresh: (self) => {
            syncLayer2AndDots(self.progress);
          },
        },
      });
    }, wrapper);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      ctx.revert();
    };
  }, [lenis, totalSlides]);

  return (
    <div ref={wrapperRef} className="fc-featured">
      <section
        ref={sectionRef}
        className="fc-section relative overflow-hidden bg-[var(--void)]"
        aria-labelledby="fc-featured-heading"
      >
        <div className="fc-heading-overlay">
          <h2 id="fc-featured-heading" className="fc-intro-title">
            <span className="fc-intro-eyebrow">Our featured</span>
            <span className="fc-intro-headline">Collection.</span>
          </h2>
          <div className="fc-intro-rule" aria-hidden />
        </div>
        {/*
        LAYER 1 (Hero-style bottom stack) — horizontal track; only this layer
        translates on scroll (left → next slide).
      */}
        <div className="fc-layer1" ref={layer1Ref}>
          {slideKeys.map((i) => (
            <div key={i} className="fc-slide">
              <div
                className="fc-l1-image absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat bg-[var(--mahogany)]"
                style={{
                  backgroundImage: `url(${FEATURED_IMAGES[i]})`,
                }}
              />
              <div className="fc-l1-void absolute inset-0" aria-hidden />
            </div>
          ))}
        </div>

        {/*
        LAYER 2 (Hero-style top stack) — full 100vw×100vh; same assets, softer
        blend + vignette; does not translate; opacity driven by scroll progress.
      */}
        <div
          ref={layer2Ref}
          className="fc-layer2 pointer-events-none absolute inset-0 z-[3] overflow-hidden will-change-transform"
          aria-hidden
        >
          {slideKeys.map((i) => (
            <div
              key={i}
              ref={(el) => {
                layer2PanelsRef.current[i] = el;
              }}
              className="fc-l2-panel"
            >
              <div
                className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat opacity-[0.50] mix-blend-soft-light"
                style={{
                  backgroundImage: `url(${FEATURED_IMAGES_2[i]})`,
                }}
              />
              <div className="fc-l2-vignette absolute inset-0" />
            </div>
          ))}
        </div>

        <div className="fc-dots">
          {slideKeys.map((i) => (
            <div
              key={i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="fc-dot"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
