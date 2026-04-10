import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Expand, X } from "lucide-react";
import { products, families } from "../../data/products";
import "../../styles/FeaturedCollection.css";

type FeaturedLevel = "primary" | "secondary";

interface Perfume {
  id: string;
  name: string;
  family: string;
  type: string;
  notes: string;
  price: string;
  ml: string;
  badge: string | null;
  image?: string;
  intensity: number;
  featuredLevel: FeaturedLevel;
}

interface FeaturedCollectionProps {
  onAddToCart?: (productId: string) => void;
}

interface BentoCardProps {
  perfume: Perfume;
  index: number;
  isMobile: boolean;
  onAddToCart?: (id: string) => void;
  onQuickView: () => void;
}

const FALLBACK_IMAGE = "/featured/1.png";

function BentoCard({
  perfume,
  index,
  isMobile,
  onAddToCart = () => {},
  onQuickView,
}: BentoCardProps) {
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = "1";
    img.src = FALLBACK_IMAGE;
  };

  return (
    <motion.article
      className={`fc2-card fc2-card--${perfume.featuredLevel}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="fc2-card-img-wrap">
        <img
          src={perfume.image || FALLBACK_IMAGE}
          alt={perfume.name}
          className="fc2-card-img"
          loading="lazy"
          onError={handleImageError}
        />

        {perfume.badge && <span className="fc2-badge">{perfume.badge}</span>}

        <div className="fc2-action-pill" aria-hidden={isMobile}>
          <button
            type="button"
            className="fc2-action-btn"
            onClick={() => onAddToCart(perfume.id)}
            aria-label={`Add ${perfume.name} to cart`}
          >
            <ShoppingBag size={14} strokeWidth={1.8} />
            <span>Add</span>
          </button>
          <span className="fc2-action-divider" aria-hidden />
          <button
            type="button"
            className="fc2-action-btn"
            onClick={onQuickView}
            aria-label={`Quick view ${perfume.name}`}
          >
            <Expand size={14} strokeWidth={1.8} />
            <span>View</span>
          </button>
        </div>

        <button
          type="button"
          className="fc2-mobile-cart-btn"
          onClick={() => onAddToCart(perfume.id)}
          aria-label={`Add ${perfume.name} to cart`}
        >
          <ShoppingBag size={16} strokeWidth={1.8} />
        </button>
      </div>

      <div className="fc2-card-body">
        <span className="fc2-card-family">{perfume.family}</span>
        <h3 className="fc2-card-name">{perfume.name}</h3>
        {perfume.featuredLevel === "primary" && (
          <p className="fc2-card-notes">{perfume.notes}</p>
        )}
        <div className="fc2-card-footer">
          <span className="fc2-card-price">{perfume.price}</span>
          {!isMobile && (
            <Link className="fc2-card-link" to={`/product/${perfume.id}`}>
              Details
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function FeaturedCollection({
  onAddToCart = () => {},
}: FeaturedCollectionProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [drawerProduct, setDrawerProduct] = useState<Perfume | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const perfumes = useMemo<Perfume[]>(
    () =>
      products.map((item) => ({
        id: String(item.id),
        name: item.name,
        family: item.family,
        type: item.type,
        notes: item.notes,
        price: `INR ${item.price}`,
        ml: item.ml,
        badge: item.badge,
        image: item.image,
        intensity: item.intensity,
        featuredLevel: "secondary",
      })),
    [],
  );

  const filteredProducts = useMemo<Perfume[]>(() => {
    const subset =
      activeTab === "All"
        ? perfumes
        : perfumes.filter((perfume) => perfume.family === activeTab);

    const primaryId =
      activeTab === "All"
        ? subset.find((perfume) => perfume.badge === "Bestseller")?.id ??
          subset[0]?.id
        : subset[0]?.id;

    return subset.map((perfume) => ({
      ...perfume,
      featuredLevel: perfume.id === primaryId ? "primary" : "secondary",
    }));
  }, [activeTab, perfumes]);

  const handleCloseDrawer = () => setDrawerProduct(null);

  return (
    <section className="fc2-section" aria-label="Featured collection">
      <div className="fc2-inner">
        <div className="fc2-header">
          <div className="fc2-eyebrow-row">
            <span className="fc2-eyebrow-line" aria-hidden />
            <span className="fc2-eyebrow-text">Our Signature</span>
          </div>
          <h2 className="fc2-headline">
            Featured <em>Collection</em>
          </h2>
        </div>

        <div className="fc2-tabs" role="tablist" aria-label="Fragrance families">
          {families.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`fc2-tab${activeTab === tab ? " fc2-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="fc2-tab-pill"
                  className="fc2-tab-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="fc2-tab-label">{tab}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="fc2-bento-grid"
            aria-label={`${activeTab} fragrances`}
          >
            {filteredProducts.slice(0, 6).map((perfume, index) => (
              <BentoCard
                key={perfume.id}
                perfume={perfume}
                index={index}
                isMobile={isMobile}
                onAddToCart={onAddToCart}
                onQuickView={() => setDrawerProduct(perfume)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {drawerProduct && (
          <>
            <motion.div
              className="fc2-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
            />
            <motion.aside
              className="fc2-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              aria-label={`Quick view: ${drawerProduct.name}`}
            >
              <button
                type="button"
                className="fc2-drawer-close"
                onClick={handleCloseDrawer}
              >
                <span>Close</span>
                <X size={18} strokeWidth={1.8} />
              </button>

              <div className="fc2-drawer-img-wrap">
                <img
                  src={drawerProduct.image || FALLBACK_IMAGE}
                  alt={drawerProduct.name}
                  className="fc2-drawer-img"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied) return;
                    img.dataset.fallbackApplied = "1";
                    img.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              <span className="fc2-drawer-family">{drawerProduct.family}</span>
              <h3 className="fc2-drawer-name">{drawerProduct.name}</h3>
              {drawerProduct.badge && (
                <span className="fc2-badge fc2-badge--drawer">
                  {drawerProduct.badge}
                </span>
              )}
              <p className="fc2-drawer-notes">{drawerProduct.notes}</p>
              <span className="fc2-drawer-price">{drawerProduct.price}</span>
              <span className="fc2-drawer-ml">{drawerProduct.ml}</span>

              <button
                type="button"
                className="fc2-drawer-add"
                onClick={() => onAddToCart(drawerProduct.id)}
              >
                Add to Cart
              </button>

              <Link
                to={`/product/${drawerProduct.id}`}
                className="fc2-drawer-link"
                onClick={handleCloseDrawer}
              >
                View Full Details
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
