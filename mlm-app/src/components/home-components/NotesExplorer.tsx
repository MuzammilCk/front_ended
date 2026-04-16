import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { useHomepage } from "../../hooks/useHomepage";
import type { HomepageScentFamily } from "../../api/types";
import { useGsapContext } from "../../hooks/useGsapContext";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Fallback data used while API loads or if API fails
const FALLBACK_SCENT_FAMILIES: HomepageScentFamily[] = [
  {
    family: "Woody & Resinous",
    count: "14 fragrances",
    description:
      "Grounded, smoldering woods—cedar, vetiver, and resin that linger like embers.",
    key_notes: ["Cedar", "Vetiver", "Sandalwood"],
    accent: "#6b5344",
  },
  {
    family: "Floral & Romantic",
    count: "9 fragrances",
    description:
      "Velvet petals and honeyed blooms—rose, jasmine, and soft powder on the skin.",
    key_notes: ["Rose", "Jasmine", "Iris"],
    accent: "#9a6b78",
  },
  {
    family: "Fresh & Aquatic",
    count: "7 fragrances",
    description:
      "Crisp air and clean water—citrus zest, sea spray, and green stems.",
    key_notes: ["Bergamot", "Marine", "Green tea"],
    accent: "#6a8f8c",
  },
  {
    family: "Oriental & Spicy",
    count: "11 fragrances",
    description:
      "Warm, resinous depths anchored by oud, amber, and spice.",
    key_notes: ["Oud", "Amber", "Cardamom"],
    accent: "#8b5e3c",
  },
];

export default function NotesExplorer() {
  const { data, loading } = useHomepage();
  const [activeFamily, setActiveFamily] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  const scentFamilies = Array.isArray(data?.scent_families) && data!.scent_families.length > 0 
    ? data!.scent_families 
    : FALLBACK_SCENT_FAMILIES;

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

  useGsapContext(() => {
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      const el = imageRef.current;
      if (!el || typeof e.beta !== 'number' || typeof e.gamma !== 'number') return;
      
      let beta = e.beta;
      let gamma = e.gamma;

      beta = Math.max(-30, Math.min(30, beta));
      gamma = Math.max(-30, Math.min(30, gamma));

      const rotX = (beta / 30) * 10;
      const rotY = (gamma / 30) * 10;

      gsap.to(el, {
        rotateX: -rotX,
        rotateY: rotY,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 800,
      });
    };

    if (typeof window !== "undefined" && 'DeviceOrientationEvent' in window) {
      try {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      } catch (err) {}
    }

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

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
    };
  }, sectionRef, []);

  if (loading) {
    return (
      <section className="ne-section">
        <div className="ne-inner">
          <div className="animate-pulse flex flex-col gap-4 py-12">
            <div className="h-8 w-48 bg-[#c9a96e]/10 rounded" />
            <div className="h-4 w-64 bg-[#c9a96e]/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

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
                      {s.key_notes.map((note, j) => (
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
