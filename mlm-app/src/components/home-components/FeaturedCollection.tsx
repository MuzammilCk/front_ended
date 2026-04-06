/*
 * Featured perfumes — assets in mlm-app/public/featured/
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollContext } from "../../lib/scroll";
import "../../styles/FeaturedCollection.css";

gsap.registerPlugin(ScrollTrigger);

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
}

const PERFUMES = [
  {
    id: 0,
    image: "/featured/1.png",
    name: "Noir Absolu",
    tagline: "The scent of midnight cedar",
    family: "Oriental · Woody",
    topNotes: "Black Pepper · Bergamot",
    heartNotes: "Oud · Vetiver",
    baseNotes: "Amber · Musk",
    price: "AED 420",
    ml: "50 ml",
  },
  {
    id: 1,
    image: "/featured/2.png",
    name: "Lumière Rose",
    tagline: "Soft power. Silk and dew.",
    family: "Floral · Fresh",
    topNotes: "Lychee · Pink Pepper",
    heartNotes: "Rose · Peony",
    baseNotes: "Sandalwood · White Musk",
    price: "AED 380",
    ml: "50 ml",
  },
  {
    id: 2,
    image: "/featured/3.png",
    name: "Sable d'Or",
    tagline: "Warmth you wear like a second skin",
    family: "Amber · Gourmand",
    topNotes: "Cardamom · Saffron",
    heartNotes: "Benzoin · Iris",
    baseNotes: "Vanilla · Labdanum",
    price: "AED 460",
    ml: "50 ml",
  },
  {
    id: 3,
    image: "/featured/4.png",
    name: "Brume Verte",
    tagline: "Rain on stone. Earth reborn.",
    family: "Aromatic · Green",
    topNotes: "Galbanum · Juniper",
    heartNotes: "Violet Leaf · Geranium",
    baseNotes: "Oakmoss · Patchouli",
    price: "AED 340",
    ml: "50 ml",
  },
  {
    id: 4,
    image: "/featured/5.png",
    name: "Ébène Céleste",
    tagline: "Dark. Timeless. Unapologetic.",
    family: "Chypre · Dark",
    topNotes: "Davana · Clove",
    heartNotes: "Dark Rose · Leather",
    baseNotes: "Ebony · Incense",
    price: "AED 520",
    ml: "50 ml",
  },
];

export default function FeaturedCollection() {
  const lenis = useScrollContext();
  const totalSlides = PERFUMES.length;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slideInfoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeSlideRef = useRef(0);

  useEffect(() => {
    const reducedMotion = prefersReducedMotion;
    if (reducedMotion || !lenis) return;

    const wrapper = wrapperRef.current;
    const section = sectionRef.current;
    const layer1 = layer1Ref.current;

    if (!wrapper || !section || !layer1) return;

    section.style.setProperty("--fc-slide-count", String(totalSlides));

    slideInfoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === 0) gsap.set(el, { opacity: 1, y: 0 });
      else gsap.set(el, { opacity: 0, y: 24 });
    });
    activeSlideRef.current = 0;

    const syncVideoPlayback = (activeIndex: number) => {
      videoRefs.current.forEach((video, i) => {
        if (!video) return;
        if (i === activeIndex) {
          video.muted = true;
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

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

    const syncActiveSlide = (progress: number) => {
      const denom = Math.max(1, PERFUMES.length - 1);
      const exactSlide = progress * denom;
      const newActive = Math.max(
        0,
        Math.min(PERFUMES.length - 1, Math.round(exactSlide)),
      );

      dotRefs.current.forEach((dot, i) => {
        dot?.classList.toggle("fc-dot--active", i === newActive);
      });

      if (newActive !== activeSlideRef.current) {
        const oldEl = slideInfoRefs.current[activeSlideRef.current];
        if (oldEl) {
          gsap.to(oldEl, {
            opacity: 0,
            y: 18,
            duration: 0.22,
            ease: "power2.in",
          });
        }
        const newEl = slideInfoRefs.current[newActive];
        if (newEl) {
          gsap.fromTo(
            newEl,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              ease: "power3.out",
              delay: 0.05,
            },
          );
        }
        activeSlideRef.current = newActive;
        syncVideoPlayback(newActive);
      }
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
            syncActiveSlide(self.progress);
          },
          onRefresh: (self) => {
            syncActiveSlide(self.progress);
          },
        },
      });
    }, wrapper);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        syncVideoPlayback(activeSlideRef.current);
      });
    });

    return () => {
      videoRefs.current.forEach((v) => v?.pause());
      ctx.revert();
    };
  }, [lenis, totalSlides, prefersReducedMotion]);

  return (
    <div ref={wrapperRef} className="fc-featured">
      <section
        ref={sectionRef}
        className="fc-section"
        aria-label="Featured collection"
      >
        <div className="fc-layer1" ref={layer1Ref}>
          {PERFUMES.map((perfume, i) => (
            <div key={perfume.id} className="fc-slide">
              {isVideoSrc(perfume.image) ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  className="fc-l1-video"
                  src={perfume.image}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  autoPlay={false}
                  aria-hidden
                />
              ) : (
                <div
                  className="fc-l1-image"
                  style={{ backgroundImage: `url(${perfume.image})` }}
                />
              )}
              <div className="fc-l1-void" aria-hidden />

              <div
                className="fc-slide-info"
                ref={(el) => {
                  slideInfoRefs.current[i] = el;
                }}
              >
                <div className="fc-slide-eyebrow">
                  <span className="fc-eyebrow-label">Our featured</span>
                  <span className="fc-eyebrow-rule" aria-hidden />
                </div>

                <h2 className="fc-slide-name">{perfume.name}</h2>
                <p className="fc-slide-tagline">{perfume.tagline}</p>

                <div className="fc-notes-panel">
                  <div className="fc-notes-group">
                    <span className="fc-notes-label">Top</span>
                    <span className="fc-notes-value">{perfume.topNotes}</span>
                  </div>
                  <div className="fc-notes-group">
                    <span className="fc-notes-label">Heart</span>
                    <span className="fc-notes-value">{perfume.heartNotes}</span>
                  </div>
                  <div className="fc-notes-group">
                    <span className="fc-notes-label">Base</span>
                    <span className="fc-notes-value">{perfume.baseNotes}</span>
                  </div>
                </div>

                <div className="fc-slide-cta-row">
                  <div className="fc-slide-price">
                    <span className="fc-price-amount">{perfume.price}</span>
                    <span className="fc-price-ml">{perfume.ml}</span>
                  </div>
                  <Link
                    className="fc-slide-btn"
                    to={`/product/${perfume.id}`}
                  >
                    Add to Cart
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="fc-dots">
          {PERFUMES.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className={`fc-dot${i === 0 ? " fc-dot--active" : ""}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
