import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../../data/products";
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

const FALLBACK_IMAGE = "/featured/holder.png";
const ALT_IMAGE = "/featured/holder.png";

export default function FeaturedCollection() {
  const lenis = useScrollContext();

  const perfumes = useMemo<FeaturedPerfume[]>(
    () =>
      products.slice(0, 5).map((item, index) => ({
        id: String(item.id),
        name: item.name,
        tags: [item.family, item.type, item.badge ?? "Signature"],
        price: `AED ${item.price}`,
        image: item.image ?? (index % 2 === 0 ? FALLBACK_IMAGE : ALT_IMAGE),
        thumbnailImage:
          item.image ?? (index % 2 === 0 ? FALLBACK_IMAGE : ALT_IMAGE),
      })),
    [],
  );

  const numPerfumes = perfumes.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(0);
  const lastActiveRef = useRef(0);
  const animKeyRef = useRef(0);
  const detailsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [leavingKey, setLeavingKey] = useState(0);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ─── Core scroll handler ────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { top, height } = el.getBoundingClientRect();
    const scrolled = -top;
    const travel = height - window.innerHeight;
    if (travel <= 0) return;
    const progress = Math.max(0, Math.min(1, scrolled / travel));
    const newIndex = Math.min(Math.floor(progress * numPerfumes), numPerfumes - 1);
    if (newIndex !== prevIndexRef.current) {
      const dir: 1 | -1 = newIndex > prevIndexRef.current ? 1 : -1;
      prevIndexRef.current = newIndex;
      setDirection(dir);
      setActiveIndex(newIndex);
    }
  }, [numPerfumes]);

  // ─── Subscribe to Lenis (preferred) or native scroll (fallback) ────────────
  useEffect(() => {
    if (isMobile) return;
    if (lenis) {
      lenis.on("scroll", handleScroll);
      handleScroll();
      return () => lenis.off("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, lenis, handleScroll]);

  // ─── Details panel fade on index change ────────────────────────────────────
  useEffect(() => {
    if (activeIndex === detailsIndex) return;
    setDetailsVisible(false);
    if (detailsTimerRef.current) clearTimeout(detailsTimerRef.current);
    detailsTimerRef.current = setTimeout(() => {
      setDetailsIndex(activeIndex);
      setDetailsVisible(true);
    }, 180);
    return () => { if (detailsTimerRef.current) clearTimeout(detailsTimerRef.current); };
  }, [activeIndex, detailsIndex]);

  // ─── Exit animation on index change ────────────────────────────────────────
  useEffect(() => {
    const prev = lastActiveRef.current;
    if (activeIndex === prev) return;
    animKeyRef.current += 1;
    setLeavingIndex(prev);
    setLeavingKey(animKeyRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => setLeavingIndex(null), 650);
    lastActiveRef.current = activeIndex;
  }, [activeIndex]);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (detailsTimerRef.current) clearTimeout(detailsTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
  }, []);

  // ─── Thumbnail click — jump scroll position to keep sync ───────────────────
  const jumpToIndex = useCallback(
    (index: number) => {
      if (index === activeIndex || !containerRef.current) return;
      const dir: 1 | -1 = index > activeIndex ? 1 : -1;
      prevIndexRef.current = index;
      setDirection(dir);
      setActiveIndex(index);

      const containerTop =
        containerRef.current.getBoundingClientRect().top + window.scrollY;
      const travel =
        containerRef.current.getBoundingClientRect().height - window.innerHeight;
      const target = containerTop + travel * (index / numPerfumes + 0.001);
      if (lenis) {
        lenis.scrollTo(target, { immediate: false, duration: 1.2 });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    },
    [activeIndex, numPerfumes, lenis],
  );

  const current = perfumes[activeIndex];
  const panel = perfumes[detailsIndex];
  const enterClass = direction === 1 ? "fc-enter-right" : "fc-enter-left";
  const exitClass = direction === 1 ? "fc-exit-left" : "fc-exit-right";
  const sceneHeight = useMemo(() => `${numPerfumes * 100}vh`, [numPerfumes]);

  // ─── Mobile — simple vertical cards ────────────────────────────────────────
  if (isMobile) {
    return (
      <section className="fc-mobile" aria-label="Featured collection">
        <p className="fc-mobile-eyebrow">Featured Collection</p>
        <div className="fc-mobile-grid">
          {perfumes.map((p) => (
            <article key={p.id} className="fc-mobile-card">
              <div className="fc-mobile-img-wrap">
                <img
                  src={p.image}
                  alt={p.name}
                  className="fc-mobile-img"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fb) return;
                    img.dataset.fb = "1";
                    img.src = ALT_IMAGE;
                  }}
                />
              </div>
              <div className="fc-mobile-body">
                <h3 className="fc-mobile-name">{p.name}</h3>
                <div className="fc-mobile-tags">
                  {p.tags.map((t) => (
                    <span key={t} className="fc-tag-pill">{t}</span>
                  ))}
                </div>
                <div className="fc-mobile-footer">
                  <span className="fc-price">{p.price}</span>
                  <Link className="fc-cta-btn" to={`/product/${p.id}`}>
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

  // ─── Desktop — sticky scroll showroom ──────────────────────────────────────
  return (
    <section className="fc-showroom" aria-label="Featured collection">
      {/* Tall div — creates scroll travel distance */}
      <div
        ref={containerRef}
        className="fc-scroll-wrapper"
        style={{ height: sceneHeight }}
      >
        {/* Sticky viewport — locks to screen while wrapper scrolls */}
        <div className="fc-sticky-scene">

          {/* ── LAYER 1: Static platform + ground shadow ── */}
          <div className="fc-platform-layer" aria-hidden>
            <div className="fc-ground-shadow" />
            <div className="fc-platform" />
          </div>

          {/* ── LAYER 2: Perfume bottle — animates on index change ── */}
          <div className="fc-bottle-layer" aria-live="off">
            {leavingIndex !== null && (
              <div
                key={`leave-${leavingKey}`}
                className={`fc-bottle-frame ${exitClass}`}
                aria-hidden
              >
                <img
                  src={perfumes[leavingIndex].image}
                  alt=""
                  className="fc-bottle-img"
                />
              </div>
            )}
            <div
              key={`active-${current.id}-${animKeyRef.current}`}
              className={`fc-bottle-frame ${enterClass}`}
            >
              <img
                src={current.image}
                alt={current.name}
                className="fc-bottle-img"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fb) return;
                  img.dataset.fb = "1";
                  img.src = ALT_IMAGE;
                }}
              />
            </div>
          </div>

          {/* ── LAYER 3: Brand details — no box, pure text ── */}
          <aside
            className={`fc-brand-details${detailsVisible ? " fc-brand-details--visible" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="fc-eyebrow">Featured Collection</p>
            <h2 className="fc-name">{panel.name}</h2>
            <div className="fc-tags">
              {panel.tags.map((tag) => (
                <span key={`${panel.id}-${tag}`} className="fc-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
            <div className="fc-details-footer">
              <span className="fc-price">{panel.price}</span>
              <Link className="fc-cta-btn" to={`/product/${panel.id}`}>
                Add to Cart
              </Link>
            </div>
          </aside>

          {/* ── LAYER 4: Thumbnail rail — right side ── */}
          <nav
            className="fc-thumb-rail"
            aria-label={`Collection — ${numPerfumes} fragrances`}
          >
            {perfumes.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`fc-thumb-btn${activeIndex === i ? " fc-thumb-btn--active" : ""}`}
                onClick={() => jumpToIndex(i)}
                aria-label={`View ${p.name}`}
                aria-pressed={activeIndex === i}
              >
                <img
                  src={p.thumbnailImage}
                  alt=""
                  className="fc-thumb-img"
                  loading="lazy"
                  aria-hidden
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fb) return;
                    img.dataset.fb = "1";
                    img.src = FALLBACK_IMAGE;
                  }}
                />
              </button>
            ))}
          </nav>

          {/* ── Scroll progress bar — no numbers ── */}
          <div className="fc-progress-wrap" aria-hidden>
            <div className="fc-progress-track">
              <div
                className="fc-progress-fill"
                style={{
                  height: `${((activeIndex + 1) / numPerfumes) * 100}%`,
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
