import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const VOID_BG =
  "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(139,105,20,0.14) 0%, rgba(42,31,21,0.32) 42%, rgba(10,7,5,0.52) 100%)";

const VIGNETTE_BG =
  "radial-gradient(ellipse 100% 80% at 50% 0%, transparent 0%, rgba(10,7,5,0.4) 60%, #0a0705 100%)";

/** Served from `mlm-app/public/` — swap paths to your assets */
const LAYER1_IMAGE_URL = "/layer1.png";
const LAYER2_IMAGE_URL = "/layer2_1.png";

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlineLine2Ref = useRef<HTMLSpanElement>(null);
  const ctaRowRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const layer1 = layer1Ref.current;
    const layer2 = layer2Ref.current;
    const layer3 = layer3Ref.current;
    const eyebrow = eyebrowRef.current;
    const line1 = headlineLine1Ref.current;
    const line2 = headlineLine2Ref.current;
    const ctaRow = ctaRowRef.current;
    const tagline = taglineRef.current;

    if (
      !container ||
      !layer1 ||
      !layer2 ||
      !layer3 ||
      !eyebrow ||
      !line1 ||
      !line2 ||
      !ctaRow ||
      !tagline
    ) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const refresh = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };

    if (prefersReducedMotion) {
      refresh();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(layer1, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(layer2, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.fromTo(
        layer3,
        { yPercent: 0, opacity: 1 },
        {
          yPercent: -20,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        },
      );

      gsap.set(eyebrow, { y: 12, opacity: 0 });
      gsap.set([line1, line2], { y: 20, opacity: 0 });
      gsap.set(ctaRow, { y: 20, opacity: 0 });
      gsap.set(tagline, { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.to(eyebrow, { y: 0, opacity: 1, duration: 0.8 });
      tl.to(
        [line1, line2],
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.2 },
        "+=0.2",
      );
      tl.to(ctaRow, { y: 0, opacity: 1, duration: 0.6 }, ">-0.35");
      tl.to(tagline, { opacity: 1, duration: 1 }, "+=0.8");
    }, container);

    refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-end overflow-hidden px-12 pb-16"
    >
      <div
        ref={layer1Ref}
        className="absolute inset-0 overflow-hidden will-change-transform"
        aria-hidden
      >
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat bg-[#1a1410]"
          style={{ backgroundImage: `url(${LAYER1_IMAGE_URL})` }}
        />
        <div className="absolute inset-0" style={{ background: VOID_BG }} />
      </div>

      <div
        ref={layer2Ref}
        className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
        aria-hidden
      >
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat opacity-[0.22] mix-blend-soft-light"
          style={{ backgroundImage: `url(${LAYER2_IMAGE_URL})` }}
        />
        <div className="absolute inset-0" style={{ background: VIGNETTE_BG }} />
      </div>

      <div
        ref={layer3Ref}
        className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-2 items-end gap-16 will-change-transform"
      >
        <div className="py-8 pr-6 md:py-12 md:pr-10">
          <div
            ref={eyebrowRef}
            className="mb-8 uppercase"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 300,
              letterSpacing: "0.18em",
              color: "var(--sand)",
            }}
          >
            New Collection 2025
          </div>

          <h1
            className="mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 6vw, 88px)",
              fontWeight: 400,
              color: "var(--text-primary)",
              lineHeight: 1.0,
            }}
          >
            <span ref={headlineLine1Ref} className="block">
              The Art
            </span>
            <span
              ref={headlineLine2Ref}
              className="block font-normal italic"
              style={{ color: "var(--sand)" }}
            >
              of Scent
            </span>
          </h1>

          <div ref={ctaRowRef} className="flex items-center gap-6">
            <button
              type="button"
              className="transition-colors duration-300 hover:bg-[var(--gold-pale)]"
              style={{
                border: "0.5px solid var(--sand)",
                color: "var(--void)",
                background: "var(--sand)",
                padding: "14px 36px",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "2px",
              }}
            >
              Explore Now
            </button>
            <Link to="/product" className="flex items-center gap-2 nav-link">
              View All →
            </Link>
          </div>
        </div>

        <div ref={taglineRef} className="text-right">
          <p
            className="font-display mb-6 text-lg font-light italic leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            &quot;Crafted for those who wear
            <br />
            their story on their skin.&quot;
          </p>
          <div className="gold-line ml-auto" />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.18em",
          }}
        >
          Scroll
        </span>
        <div className="hero-scroll-line" aria-hidden />
      </div>
    </section>
  );
}
