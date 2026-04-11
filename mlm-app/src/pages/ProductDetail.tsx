import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getListingById } from "../api/listings";
import type { Listing } from "../api/types";
import { Alert } from "../components/ui/Alert";
import Sidebar from "../components/Sidebar";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 20;
const frames = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return `/frames/frame_${n}.jpg`;
});

const ProductSequence = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameObj = useRef({ current: 0 });

  useEffect(() => {
    // Preload all frames
    imagesRef.current = frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (img && img.complete) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Compute to draw image covered / contained to the canvas nicely
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio  = Math.min(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width*ratio) / 2;
        const centerShift_y = (canvas.height - img.height*ratio) / 2;  

        ctx.drawImage(img, 0,0, img.width, img.height,
                      centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);  
      }
    };

    const firstImg = imagesRef.current[0];
    if (firstImg) {
      firstImg.onload = () => renderFrame(0);
      if (firstImg.complete) renderFrame(0);
    }

    const ctxSt = gsap.context(() => {
      gsap.to(frameObj.current, {
        current: TOTAL_FRAMES - 1,
        snap: 'current',
        ease: 'none',
        scrollTrigger: {
          trigger: '#sequence-container',
          start: 'top top',
          end: '+=2000',   // 2000px of scroll for full rotation
          scrub: 0.5,
          pin: true,       // Pins the section while scrolling through frames
        },
        onUpdate: () => renderFrame(Math.round(frameObj.current.current)),
      });
      
      gsap.to('.hero-titles', {
        opacity: 0,
        y: -50,
        scrollTrigger: {
          trigger: '#sequence-container',
          start: 'top top',
          end: '+=500',
          scrub: true,
        }
      });
    }, canvasRef);

    return () => ctxSt.revert();
  }, []);

  return (
    <div id="sequence-container" className="relative w-full h-screen bg-black overflow-hidden border-b border-[#2a2a2a]">
      <div className="absolute inset-x-0 top-[15%] hero-titles flex flex-col items-center justify-center z-10 pointer-events-none">
        <h2 className="text-[#e8dcc8] text-5xl md:text-7xl font-display uppercase tracking-widest text-center mt-12 drop-shadow-2xl">
          360° Vision
        </h2>
        <p className="text-[#c9a96e] tracking-[0.4em] mt-6 text-xs font-serif uppercase">
          Scroll to explore
        </p>
      </div>
      <canvas 
        ref={canvasRef} 
        width={1920} 
        height={1080} 
        className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(201,169,110,0.15)]" 
      />
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      setIsLoading(true);
      setLoadError('');

      getListingById(id)
        .then((data) => {
          if (!cancelled) setListing(data);
        })
        .catch(() => {
          if (!cancelled)
            setLoadError('Could not load this product. It may be unavailable.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    };

    void run();
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-[#2a2a2a] p-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link
          to="/product"
          className="text-xs tracking-widest text-[#c9a96e]/70 hover:text-[#c9a96e] transition"
        >
          ← Back to Collection
        </Link>
      </div>

      <ProductSequence />

      <div className="px-4 py-20 sm:px-6 md:px-12 max-w-7xl mx-auto">

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-24">
            <span className="text-white/40 text-sm tracking-widest">
              Loading…
            </span>
          </div>
        )}

        {/* Error */}
        {loadError && !isLoading && (
          <div className="max-w-md mx-auto mt-12">
            <Alert variant="warn">{loadError}</Alert>
            <div className="mt-6 text-center">
              <Link
                to="/product"
                className="text-xs tracking-widest text-[#c9a96e] hover:text-white transition"
              >
                ← Return to Collection
              </Link>
            </div>
          </div>
        )}

        {/* Detail view */}
        {!isLoading && listing && (
          <div className="grid gap-12 md:grid-cols-2">

            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-[#0c0c0c]">
              {listing.images.length > 0 ? (
                <img
                  src={listing.images[0].storage_key}
                  alt={listing.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-white/20 text-xs tracking-widest">
                    No image available
                  </span>
                </div>
              )}

              {/* Status badge */}
              {listing.status !== 'active' && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-[10px] tracking-widest text-[#c9a96e] border border-[#c9a96e44]">
                    {listing.status}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center space-y-6">

              {/* Category */}
              {listing.category && (
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#c9a96e66]">
                  {listing.category.name}
                </p>
              )}

              {/* Title */}
              <h1 className="text-4xl font-display text-[#e8dcc8] leading-tight">
                {listing.title}
              </h1>

              {/* SKU */}
              <p className="text-xs text-white/30 tracking-widest">
                SKU: {listing.sku}
              </p>

              {/* Description */}
              {listing.description && (
                <p className="text-sm text-[#c9b99a]/70 leading-relaxed max-w-md">
                  {listing.description}
                </p>
              )}

              {/* Price */}
              <div className="pt-4 border-t border-[#2a2a2a]">
                <p className="text-3xl text-[#c9a96e] font-light tracking-wide">
                  INR {parseFloat(listing.price).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 text-xs tracking-widest border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0705] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
              >
                {addedToCart ? 'ADDED TO CART ✓' : 'ADD TO CART →'}
              </button>

              {/* Additional images */}
              {listing.images.length > 1 && (
                <div className="flex gap-3 pt-2">
                  {listing.images.slice(1, 5).map((img) => (
                    <div
                      key={img.id}
                      className="w-16 h-16 overflow-hidden border border-[#2a2a2a] hover:border-[#c9a96e]/40 transition cursor-pointer"
                    >
                      <img
                        src={img.storage_key}
                        alt={listing.title}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
