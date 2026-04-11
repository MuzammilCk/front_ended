import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  motion,
  useMotionValue,
  useSpring,
  type Transition,
} from "../../lib/motion";
import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useHomepage } from "../../hooks/useHomepage";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/HeroSection.css";

gsap.registerPlugin(ScrollTrigger);

const VOID_BG =
  "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(139,105,20,0.14) 0%, rgba(42,31,21,0.32) 42%, rgba(10,7,5,0.52) 100%)";

const VIGNETTE_BG =
  "radial-gradient(ellipse 100% 80% at 50% 0%, transparent 0%, rgba(10,7,5,0.4) 60%, #0a0705 100%)";

/** Fallback paths served from mlm-app/public/ */
const LAYER1_FALLBACK = "/layer1.png";
const LAYER2_FALLBACK = "/layer2_1.png";

export default function HeroSection() {
  const { isLoggedIn } = useAuth();
  const { data, loading } = useHomepage();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const hero = data?.hero;
  const eyebrow = hero?.eyebrow ?? "New Collection 2025";
  const headlineLine1 = hero?.headline?.split('\n')[0] ?? "The Art";
  const headlineLine2 = hero?.headline?.split('\n')[1] ?? "of Scent.";
  const notes = hero?.notes ?? "Dark woods · Amber · Smoke — 50 ml";
  const ctaText = hero?.cta_text ?? (isLoggedIn ? "Shop Now" : "Explore Now");
  const layer1Image = hero?.image_url ?? LAYER1_FALLBACK;

  const prefersReducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const springX = useSpring(btnX, { stiffness: 300, damping: 25 });
  const springY = useSpring(btnY, { stiffness: 300, damping: 25 });

  const revealTransition = (delay = 0): Transition => ({
    duration: prefersReducedMotion ? 0 : 1.1,
    ease: [0.16, 1, 0.3, 1],
    delay: prefersReducedMotion ? 0 : delay,
  });

  useEffect(() => {
    const container = heroRef.current;
    const layer1 = layer1Ref.current;
    const layer2 = layer2Ref.current;
    if (!container || !layer1 || !layer2) {
      return;
    }

    const userPrefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const refresh = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };

    if (userPrefersReducedMotion) {
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
    }, container);

    refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  const handleMagnetMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 100;
    if (dist < maxDist) {
      const pull = (1 - dist / maxDist) * 0.35;
      btnX.set(dx * pull);
      btnY.set(dy * pull);
    }
  };

  const handleMagnetLeave = () => {
    btnX.set(0);
    btnY.set(0);
  };

  if (loading) {
    return (
      <section className="hs2-section" aria-label="Hero">
        <div className="hs2-content-grid">
          <div className="hs2-left">
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-4 w-40 bg-[#c9a96e]/10 rounded" />
              <div className="h-16 w-72 bg-[#c9a96e]/10 rounded" />
              <div className="h-4 w-56 bg-[#c9a96e]/10 rounded" />
              <div className="h-12 w-40 bg-[#c9a96e]/10 rounded mt-4" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={heroRef} className="hs2-section" aria-label="Hero">
      <div ref={layer1Ref} className="hs2-bg-layer1" aria-hidden>
        <div
          className="hs2-bg-img"
          style={{ backgroundImage: `url(${layer1Image})` }}
        />
        <div className="hs2-bg-overlay" style={{ background: VOID_BG }} />
      </div>

      <div ref={layer2Ref} className="hs2-bg-layer2" aria-hidden>
        <div
          className="hs2-bg-texture"
          style={{ backgroundImage: `url(${LAYER2_FALLBACK})` }}
        />
        <div className="hs2-bg-overlay" style={{ background: VIGNETTE_BG }} />
      </div>

      <div className="hs2-content-grid">
        <div className="hs2-left">
          <motion.div
            className="hs2-eyebrow"
            initial={
              prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className="hs2-eyebrow-dot" aria-hidden />
            <span>{eyebrow}</span>
          </motion.div>

          <h1 className="hs2-headline" aria-label={`${headlineLine1} ${headlineLine2}`}>
            <motion.span
              className="hs2-hl-line1"
              initial={
                prefersReducedMotion
                  ? { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }
                  : { opacity: 0, y: 30, clipPath: "inset(0 0 100% 0)" }
              }
              animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
              transition={revealTransition(0)}
            >
              {headlineLine1}
            </motion.span>
            <br />
            <motion.em
              className="hs2-hl-line2"
              initial={
                prefersReducedMotion
                  ? { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }
                  : { opacity: 0, y: 30, clipPath: "inset(0 0 100% 0)" }
              }
              animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
              transition={revealTransition(0.1)}
            >
              {headlineLine2}
            </motion.em>
          </h1>

          <motion.p
            className="hs2-notes"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1, delay: prefersReducedMotion ? 0 : 0.6 }}
          >
            {notes}
          </motion.p>

          <motion.div
            className="hs2-cta-row"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: prefersReducedMotion ? 0 : 0.75,
            }}
          >
            <motion.div
              className="hs2-cta-magnet"
              onMouseMove={handleMagnetMove}
              onMouseLeave={handleMagnetLeave}
              style={{ display: "inline-block" }}
            >
              <motion.button
                ref={btnRef}
                type="button"
                className="hs2-cta-btn"
                style={{ x: springX, y: springY }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.97 }}
                onClick={() => navigate(hero?.cta_link ?? "/product")}
              >
                <span>{ctaText}</span>
                <span className="hs2-cta-arrow" aria-hidden>
                  →
                </span>
              </motion.button>
            </motion.div>

            <Link to="/product" className="hs2-secondary-link">
              View All <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>

      </div>

      <div className="hs2-scroll-hint" aria-hidden>
        <span className="hs2-scroll-text">Scroll</span>
        <div className="hero-scroll-line" aria-hidden />
      </div>
    </section>
  );
}
