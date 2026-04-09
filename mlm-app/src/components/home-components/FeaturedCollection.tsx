import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../../data/products";
import "../../styles/FeaturedCollection.css";

interface FeaturedPerfume {
  id: string;
  name: string;
  tags: string[];
  price: string;
  image: string;
  thumbnailImage: string;
}

const FALLBACK_IMAGE = "/featured/p1.png";
const ALT_IMAGE = "/featured/holder.png";

export default function FeaturedCollection() {
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

  const [activeIndex, setActiveIndex] = useState(0);
  const activePerfume = perfumes[activeIndex];

  if (!activePerfume) return null;

  return (
    <section className="fc-showroom" aria-label="Featured collection">
      <div className="fc-editorial-grid">
        <article className="fc-copy">
          <p className="fc-eyebrow">Featured Collection</p>
          <h2 className="fc-title">Crafted For Signature Presence</h2>
          <p className="fc-description">
            A curated fragrance stage designed to spotlight composition, depth,
            and lasting character in every bottle.
          </p>
          <h3 className="fc-name">{activePerfume.name}</h3>
          <div className="fc-tags">
            {activePerfume.tags.map((tag) => (
              <span key={`${activePerfume.id}-${tag}`} className="fc-tag-pill">
                {tag}
              </span>
            ))}
          </div>
          <div className="fc-details-footer">
            <span className="fc-price">{activePerfume.price}</span>
            <Link className="fc-cta-btn" to={`/product/${activePerfume.id}`}>
              Add to Cart
            </Link>
          </div>
        </article>

        <div className="fc-stage">
          <div className="fc-stage-light" aria-hidden />
          <div className="fc-stage-fog" aria-hidden />
          <div className="fc-stage-platform" aria-hidden />
          <div className="fc-stage-bottle-wrap">
            <img
              key={activePerfume.id}
              src={activePerfume.image}
              alt={activePerfume.name}
              className="fc-stage-bottle"
              loading="eager"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.dataset.fallbackApplied === "true") return;
                img.dataset.fallbackApplied = "true";
                img.src = ALT_IMAGE;
              }}
            />
          </div>

          <div
            className="fc-thumbnail-rail"
            aria-label={`Featured perfume selection, ${perfumes.length} items`}
          >
            {perfumes.map((perfume, index) => (
              <button
                key={perfume.id}
                type="button"
                className={`fc-thumb-btn${index === activeIndex ? " fc-thumb-btn--active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`View ${perfume.name}`}
                aria-pressed={index === activeIndex}
              >
                <img
                  src={perfume.thumbnailImage}
                  alt=""
                  className="fc-thumb-image"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied === "true") return;
                    img.dataset.fallbackApplied = "true";
                    img.src = FALLBACK_IMAGE;
                  }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}