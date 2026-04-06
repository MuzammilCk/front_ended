import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { scentFamilies } from "../../data/HomeData";

gsap.registerPlugin(ScrollTrigger);

export default function NotesExplorer() {
  const [activeFamily, setActiveFamily] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = imageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.6,
      ease: "power2.out",
      transformPerspective: 800,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(imageRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 1,
      ease: "elastic.out(1, 0.6)",
    });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        x: -40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });
      gsap.from(imageRef.current, {
        x: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="ne-section">
      <div className="ne-inner">
        <div ref={leftRef} className="ne-left">
          <div className="ne-eyebrow">
            <span className="ne-eyebrow-line" />
            <span>Discover by</span>
          </div>

          <h2 className="ne-headline">
            Scent <em>Families</em>
          </h2>

          <div className="ne-list">
            {scentFamilies.map((s, i) => (
              <button
                key={i}
                type="button"
                className={`ne-family-row ${activeFamily === i ? "ne-family-row--active" : ""}`}
                onMouseEnter={() => setActiveFamily(i)}
                onClick={() => setActiveFamily(i)}
              >
                <div className="ne-family-main">
                  <span className="ne-family-name">{s.family}</span>
                  <span className="ne-family-count">{s.count}</span>
                </div>
                <div className="ne-family-expand">
                  <div className="ne-family-expand-inner">
                    <p className="ne-family-desc">{s.description}</p>
                    <div className="ne-family-notes">
                      {s.keyNotes.map((note, j) => (
                        <span key={j} className="ne-note-chip">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Link to="/product" className="ne-cta">
            <span>Browse all fragrances</span>
            <span className="ne-cta-arrow">→</span>
          </Link>
        </div>

        <div
          ref={imageRef}
          className="ne-image-wrap"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="ne-image"
            style={{ backgroundImage: "url('/notes-flat.png')" }}
            role="img"
            aria-label="Luxury perfume raw ingredients"
          />
          <div className="ne-image-veil" />

          <div className="ne-image-label">
            <span className="ne-image-label-name">
              {scentFamilies[activeFamily]?.family}
            </span>
            <span className="ne-image-label-sub">Scent Family</span>
          </div>

          <div className="ne-corner-tl" aria-hidden />
          <div className="ne-corner-br" aria-hidden />
        </div>
      </div>
    </section>
  );
}
