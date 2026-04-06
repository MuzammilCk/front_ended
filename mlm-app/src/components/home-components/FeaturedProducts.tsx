import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import "../../styles/Home.css";

gsap.registerPlugin(ScrollTrigger);

export interface FeaturedProductItem {
  id: string | number;
  image: string;
  name: string;
  price: string | number;
  category?: string;
}

interface FeaturedProductsProps {
  products: FeaturedProductItem[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
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

      const cards = cardRefs.current.filter(
        (el): el is HTMLDivElement => el != null,
      );
      if (cards.length) {
        gsap.from(cards, {
          y: 50,
          opacity: 0,
          duration: 1.1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
          },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const tiltCard = (e: MouseEvent<HTMLDivElement>, i: number) => {
    const el = cardRefs.current[i];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateY: x * 6,
      rotateX: -y * 6,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 900,
    });
  };

  const resetCard = (i: number) => {
    const el = cardRefs.current[i];
    if (!el) return;
    gsap.to(el, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.7)",
    });
  };

  return (
    <section ref={sectionRef} className="fp-section">
      <div className="fp-inner">
        <div ref={headerRef} className="fp-header">
          <div className="fp-header-left">
            <div className="fp-eyebrow">
              <span className="fp-eyebrow-line" />
              <span>Our Signature</span>
            </div>
            <h2 className="fp-headline">
              Featured <em>Fragrances</em>
            </h2>
          </div>
          <Link to="/product" className="fp-view-all">
            <span>View entire collection</span>
            <span className="fp-arrow">→</span>
          </Link>
        </div>

        <div className="fp-grid">
          {products.slice(0, 3).map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="fp-card"
              style={{ transformStyle: "preserve-3d" }}
              onMouseMove={(e) => tiltCard(e, i)}
              onMouseLeave={() => resetCard(i)}
            >
              <Link to={`/product/${item.id}`} className="fp-card-link">
                <div className="fp-card-image-wrap">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="fp-card-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="fp-card-shimmer" aria-hidden />
                  <div className="fp-card-overlay" aria-hidden>
                    <span className="fp-card-overlay-btn">Add to Cart</span>
                  </div>
                </div>

                <div className="fp-card-body">
                  <div className="fp-card-meta">
                    <span className="fp-card-family">
                      {item.category ?? "Signature"}
                    </span>
                    <span className="fp-card-ml">50 ml</span>
                  </div>
                  <h3 className="fp-card-name">{item.name}</h3>
                  <div className="fp-card-price-row">
                    <span className="fp-card-price">AED {item.price}</span>
                    <span className="fp-card-arrow">→</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
