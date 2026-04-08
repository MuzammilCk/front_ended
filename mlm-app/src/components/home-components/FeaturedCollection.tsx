import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(0);
  const lastActiveIndexRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const detailsTimeoutRef = useRef<number | null>(null);
  const stageTimeoutRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
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
        directionRef.current = nextDirection;
        setDirection(nextDirection);
        prevIndexRef.current = newIndex;
        setActiveIndex(newIndex);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, numPerfumes]);

  useEffect(() => {
    if (activeIndex === detailsIndex) return;
    setDetailsVisible(false);

    if (detailsTimeoutRef.current) {
      window.clearTimeout(detailsTimeoutRef.current);
    }

    detailsTimeoutRef.current = window.setTimeout(() => {
      setDetailsIndex(activeIndex);
      setDetailsVisible(true);
    }, 200);

    return () => {
      if (detailsTimeoutRef.current) {
        window.clearTimeout(detailsTimeoutRef.current);
      }
    };
  }, [activeIndex, detailsIndex]);

  useEffect(() => {
    const previous = lastActiveIndexRef.current;
    if (activeIndex === previous) return;

    setLeavingIndex(previous);
    if (stageTimeoutRef.current) {
      window.clearTimeout(stageTimeoutRef.current);
    }
    stageTimeoutRef.current = window.setTimeout(() => {
      setLeavingIndex(null);
    }, 620);

    lastActiveIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(
    () => () => {
      if (detailsTimeoutRef.current) window.clearTimeout(detailsTimeoutRef.current);
      if (stageTimeoutRef.current) window.clearTimeout(stageTimeoutRef.current);
    },
    [],
  );

  const currentPerfume = perfumes[activeIndex];
  const panelPerfume = perfumes[detailsIndex];

  const enterClass =
    direction === 1 ? "perfume-enter-right" : "perfume-enter-left";
  const exitClass = direction === 1 ? "perfume-exit-left" : "perfume-exit-right";

  const sceneHeight = useMemo(() => `${numPerfumes * 100}vh`, [numPerfumes]);

  const jumpToIndex = (index: number) => {
    if (index === activeIndex) return;
    const jumpDirection: 1 | -1 = index > activeIndex ? 1 : -1;
    directionRef.current = jumpDirection;
    setDirection(jumpDirection);
    prevIndexRef.current = index;
    setActiveIndex(index);
  };

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

  return (
    <section className="fc-showroom" aria-label="Featured collection">
      <div ref={containerRef} className="fc-scroll-wrapper" style={{ height: sceneHeight }}>
        <div className="fc-sticky-scene">
          <div className="fc-platform-layer" aria-hidden>
            <div className="fc-ground-shadow" />
            <div className="fc-platform" />
          </div>

          <div className="fc-perfume-layer" aria-live="off">
            {leavingIndex !== null && (
              <div className={`fc-perfume-frame ${exitClass}`}>
                <img
                  src={perfumes[leavingIndex].image}
                  alt=""
                  className="fc-perfume-image"
                  aria-hidden
                />
              </div>
            )}
            <div className={`fc-perfume-frame ${enterClass}`} key={`active-${currentPerfume.id}`}>
              <img
                src={currentPerfume.image}
                alt={currentPerfume.name}
                className="fc-perfume-image"
              />
            </div>
          </div>

          <aside
            className={`fc-details-panel${detailsVisible ? " fc-details-panel--visible" : ""}`}
            aria-live="polite"
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
                <span className="fc-thumb-code">{`P${i + 1}`}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
