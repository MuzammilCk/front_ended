import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollContext } from "../../lib/scroll";
import "../../styles/FeaturedCollection.css";

interface FeaturedPerfume {
  id: string;
  name: string;
  tags: string[];
  price: string;
  image: string;
  thumbnailImage: string;
}

const FEATURED_PERFUMES: FeaturedPerfume[] = [
  {
    id: "0",
    name: "Noir Absolu",
    tags: ["Oriental", "Woody", "Night Edit"],
    price: "AED 420",
    image: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
    thumbnailImage: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
  },
  {
    id: "1",
    name: "Lumiere Rose",
    tags: ["Floral", "Fresh", "Silk Accord"],
    price: "AED 380",
    image: "/featured/A_luxury_perfume_202604082010.png",
    thumbnailImage: "/featured/A_luxury_perfume_202604082010.png",
  },
  {
    id: "2",
    name: "Sable d'Or",
    tags: ["Amber", "Gourmand", "Signature"],
    price: "AED 460",
    image: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
    thumbnailImage: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
  },
  {
    id: "3",
    name: "Brume Verte",
    tags: ["Aromatic", "Green", "Daywear"],
    price: "AED 340",
    image: "/featured/A_luxury_perfume_202604082010.png",
    thumbnailImage: "/featured/A_luxury_perfume_202604082010.png",
  },
  {
    id: "4",
    name: "Ebene Celeste",
    tags: ["Chypre", "Dark", "Limited"],
    price: "AED 520",
    image: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
    thumbnailImage: "/featured/[ATTACHED_PERFUME_BOTTLE]_202604082010.png",
  },
];

export default function FeaturedCollection() {
  const perfumes = FEATURED_PERFUMES;
  const numPerfumes = perfumes.length;

  // ─── Lenis instance (smooth-scroll provider) ───────────────────────────────
  const lenis = useScrollContext();

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(0);
  const lastActiveIndexRef = useRef(0);
  const animKeyRef = useRef(0); // increments every time index changes

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );

  // Details panel fade state
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const detailsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leaving perfume for exit animation
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [leavingAnimKey, setLeavingAnimKey] = useState(0);
  const stageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // ─── Core scroll handler (pure function, stable reference) ─────────────────
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { top, height } = containerRef.current.getBoundingClientRect();
    const scrolled = -top;
    const sectionHeight = height - window.innerHeight;
    const safeSectionHeight = sectionHeight <= 0 ? 1 : sectionHeight;
    const progress = Math.max(0, Math.min(1, scrolled / safeSectionHeight));
    const newIndex = Math.min(
      Math.floor(progress * numPerfumes),
      numPerfumes - 1,
    );

    if (newIndex !== prevIndexRef.current) {
      const nextDirection: 1 | -1 = newIndex > prevIndexRef.current ? 1 : -1;
      prevIndexRef.current = newIndex;
      setDirection(nextDirection);
      setActiveIndex(newIndex);
    }
  }, [numPerfumes]);

  // ─── Subscribe to Lenis scroll (bypasses window event timing issues) ────────
  useEffect(() => {
    if (isMobile) return;

    if (lenis) {
      // Lenis fires this on every animated scroll tick — most reliable approach
      lenis.on("scroll", handleScroll);
      // Run once on mount to set correct initial state
      handleScroll();
      return () => {
        lenis.off("scroll", handleScroll);
      };
    }

    // Fallback for when Lenis is not yet initialized (SSR / first render)
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, lenis, handleScroll]);

  // ─── Details panel fade on index change ───────────────────────────────────
  useEffect(() => {
    if (activeIndex === detailsIndex) return;

    setDetailsVisible(false);
    if (detailsTimeoutRef.current) clearTimeout(detailsTimeoutRef.current);

    detailsTimeoutRef.current = setTimeout(() => {
      setDetailsIndex(activeIndex);
      setDetailsVisible(true);
    }, 200);

    return () => {
      if (detailsTimeoutRef.current) clearTimeout(detailsTimeoutRef.current);
    };
  }, [activeIndex, detailsIndex]);

  // ─── Stage exit animation on index change ─────────────────────────────────
  useEffect(() => {
    const previous = lastActiveIndexRef.current;
    if (activeIndex === previous) return;

    animKeyRef.current += 1;
    setLeavingIndex(previous);
    setLeavingAnimKey(animKeyRef.current);

    if (stageTimeoutRef.current) clearTimeout(stageTimeoutRef.current);
    stageTimeoutRef.current = setTimeout(() => {
      setLeavingIndex(null);
    }, 650);

    lastActiveIndexRef.current = activeIndex;
  }, [activeIndex]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(
    () => () => {
      if (detailsTimeoutRef.current) clearTimeout(detailsTimeoutRef.current);
      if (stageTimeoutRef.current) clearTimeout(stageTimeoutRef.current);
    },
    [],
  );

  // ─── Jump to index (thumbnail click) ──────────────────────────────────────
  // Also scrolls the page so scroll state stays in sync with Lenis
  const jumpToIndex = useCallback(
    (index: number) => {
      if (index === activeIndex || !containerRef.current) return;

      const jumpDirection: 1 | -1 = index > activeIndex ? 1 : -1;
      prevIndexRef.current = index;
      setDirection(jumpDirection);
      setActiveIndex(index);

      // Sync the actual scroll position so the next Lenis event keeps this index
      const { top: containerTop } = containerRef.current.getBoundingClientRect();
      const containerScrollTop = containerTop + window.scrollY;
      const height = containerRef.current.getBoundingClientRect().height;
      const sectionHeight = height - window.innerHeight;
      const targetProgress = index / numPerfumes + 0.001; // small offset to land inside the bucket
      const targetScroll = containerScrollTop + sectionHeight * targetProgress;

      if (lenis) {
        lenis.scrollTo(targetScroll, { immediate: false, duration: 1.2 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    },
    [activeIndex, numPerfumes, lenis],
  );

  // ─── Derived values ────────────────────────────────────────────────────────
  const currentPerfume = perfumes[activeIndex];
  const panelPerfume = perfumes[detailsIndex];

  const enterClass = direction === 1 ? "perfume-enter-right" : "perfume-enter-left";
  const exitClass = direction === 1 ? "perfume-exit-left" : "perfume-exit-right";

  // Give enough scroll travel: each perfume gets its own 100vh slot
  const sceneHeight = useMemo(
    () => `${numPerfumes * 100}vh`,
    [numPerfumes],
  );

  // ─── Mobile fallback ───────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section className="fc-mobile" aria-label="Featured collection">
        <div className="fc-mobile-grid">
          {perfumes.map((perfume) => (
            <article key={perfume.id} className="fc-mobile-card">
              <div className="fc-mobile-image-wrap">
                <img
                  src={perfume.image}
                  alt={perfume.name}
                  className="fc-mobile-image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="fc-mobile-content">
                <h3 className="fc-mobile-name">{perfume.name}</h3>
                <div className="fc-mobile-tags">
                  {perfume.tags.map((tag) => (
                    <span key={`${perfume.id}-${tag}`} className="fc-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="fc-mobile-footer">
                  <span className="fc-mobile-price">{perfume.price}</span>
                  <Link className="fc-cta-btn" to={`/product/${perfume.id}`}>
                    Add to Cart
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  // ─── Desktop showroom ──────────────────────────────────────────────────────
  return (
    <section className="fc-showroom" aria-label="Featured collection">
      {/* Tall scroll container — creates the scroll travel distance */}
      <div ref={containerRef} className="fc-scroll-wrapper" style={{ height: sceneHeight }}>
        {/* Sticky scene — locks in viewport while wrapper scrolls beneath it */}
        <div className="fc-sticky-scene">

          {/* LAYER 1: Platform — never moves */}
          <div className="fc-platform-layer" aria-hidden>
            <div className="fc-ground-shadow" />
            <div className="fc-platform" />
          </div>

          {/* LAYER 2: Perfume stage — slides on index change */}
          <div className="fc-perfume-layer" aria-live="off">
            {/* Leaving perfume — exits with animation */}
            {leavingIndex !== null && (
              <div
                key={`leaving-${leavingAnimKey}`}
                className={`fc-perfume-frame ${exitClass}`}
                aria-hidden
              >
                <img
                  src={perfumes[leavingIndex].image}
                  alt=""
                  className="fc-perfume-image"
                />
              </div>
            )}
            {/* Active perfume — enters with animation */}
            <div
              key={`active-${currentPerfume.id}-${animKeyRef.current}`}
              className={`fc-perfume-frame ${enterClass}`}
            >
              <img
                src={currentPerfume.image}
                alt={currentPerfume.name}
                className="fc-perfume-image"
              />
            </div>
          </div>

          {/* LAYER 3: Details panel — fades on index change */}
          <aside
            className={`fc-details-panel${detailsVisible ? " fc-details-panel--visible" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="fc-eyebrow">Our featured</p>
            <h2 className="fc-name">{panelPerfume.name}</h2>
            <div className="fc-tags">
              {panelPerfume.tags.map((tag) => (
                <span key={`${panelPerfume.id}-${tag}`} className="fc-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
            <div className="fc-details-footer">
              <span className="fc-price">{panelPerfume.price}</span>
              <Link className="fc-cta-btn" to={`/product/${panelPerfume.id}`}>
                Add to Cart
              </Link>
            </div>
          </aside>

          {/* LAYER 4: Thumbnail rail — right side vertical strip */}
          <nav
            className="fc-thumbnail-rail"
            aria-label={`Perfume collection, ${numPerfumes} items`}
          >
            {perfumes.map((perfume, i) => (
              <button
                key={perfume.id}
                type="button"
                className={`fc-thumb-btn${activeIndex === i ? " fc-thumb-btn--active" : ""}`}
                onClick={() => jumpToIndex(i)}
                aria-label={`View ${perfume.name}`}
                aria-pressed={activeIndex === i}
              >
                <img
                  src={perfume.thumbnailImage}
                  alt=""
                  className="fc-thumb-image"
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                />
              </button>
            ))}
          </nav>

          {/* Scroll progress indicator */}
          <div className="fc-scroll-hint" aria-hidden>
            <div className="fc-scroll-progress">
              <div
                className="fc-scroll-progress-bar"
                style={{ height: `${((activeIndex + 1) / numPerfumes) * 100}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}