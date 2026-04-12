import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getListingById } from "../api/listings";
import type { Listing } from "../api/types";
import { useCart } from "../context/CartContext";
import { useGsapContext } from "../hooks/useGsapContext";
import LuxuryImage from "../components/ui/LuxuryImage";
import { getImageUrl } from "../utils/imageUrl";
import { Alert } from "../components/ui/Alert";
import Sidebar from "../components/Sidebar";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import CartDrawer from "../components/Cart-components/CartDrawer";

const ProductSequence = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameObj = useRef({ frame: 0 });
  const [loadedFrame, setLoadedFrame] = useState(0);

  const [frames, setFrames] = useState<string[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const count = isSafari ? 10 : 20;
    
    const paths = Array.from({ length: count }, (_, i) => {
      const idx = isSafari ? i * 2 + 1 : i + 1;
      const n = String(idx).padStart(3, '0');
      return `/frames/frame_${n}.webp`;
    });
    setFrames(paths);

    document.body.style.overflow = 'hidden';

    let loaded = 0;
    const imgObjs = paths.map(src => {
      const img = new Image();
      img.src = src;
      return new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => {
          loaded++;
          setLoadProgress((loaded / count) * 100);
          resolve(img);
        };
        img.onerror = () => {
          // ignore error to keep promise.all resolving, or just reject
          loaded++;
          setLoadProgress((loaded / count) * 100);
          resolve(img);
        };
      });
    });

    Promise.all(imgObjs).then(imgs => {
      imagesRef.current = imgs;
      setIsReady(true);
      document.body.style.overflow = '';
      if ((window as any).lenis) (window as any).lenis.start();
    });

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[loadedFrame];
    if (img && img.complete) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio  = Math.min(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width*ratio) / 2;
      const centerShift_y = (canvas.height - img.height*ratio) / 2;  

      ctx.drawImage(img, 0,0, img.width, img.height,
                    centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);  
    }
  }, [loadedFrame]);

  useGsapContext(() => {
    if (!containerRef.current) return;

    gsap.to(frameObj.current, {
      frame: Math.max(0, frames.length - 1),
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=200%",
        scrub: 1.5,
      },
      onUpdate: () => {
        const f = Math.round(frameObj.current.frame);
        setLoadedFrame(f);
      },
    });

    gsap.to(".hero-titles", {
      opacity: 0,
      y: -50,
      duration: 1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=50%",
        scrub: true,
      },
    });

    gsap.set(".reveal-feature", { opacity: 0, y: 30 });
    gsap.to(".reveal-feature", {
      opacity: 1,
      y: 0,
      stagger: 0.2,
      duration: 0.8,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top left",
        end: "+=150%",
        scrub: true,
      },
    });
  }, containerRef, []);

  return (
    <div ref={containerRef} id="sequence-container" className="relative w-full h-screen bg-black overflow-hidden border-b border-[#2a2a2a]">
      <div className="absolute inset-x-0 top-[15%] hero-titles flex flex-col items-center justify-center z-10 pointer-events-none">
        <h2 className="text-[#e8dcc8] text-5xl md:text-7xl font-display uppercase tracking-widest text-center mt-12 drop-shadow-2xl">
          360° Vision
        </h2>
        <p className="text-[#c9a96e] tracking-[0.4em] mt-6 text-xs font-serif uppercase">
          Scroll to explore
        </p>
      </div>

      {!isReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <p className="text-white/40 tracking-widest text-xs uppercase mb-4">Loading Experience...</p>
          <div className="w-64 h-px bg-white/10 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[#c9a96e] transition-all duration-200" 
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={1920} 
        height={1080} 
        style={{ willChange: 'transform' }} 
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
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  
  const mainCtaRef = useRef<HTMLButtonElement>(null);

  const { addItem } = useCart();

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

    const ctaEl = mainCtaRef.current;
    if (ctaEl) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Show sticky bar when main CTA is out of view (scrolled above it)
          if (entry.boundingClientRect.top < 0 && !entry.isIntersecting) {
            setShowStickyBar(true);
          } else {
            setShowStickyBar(false);
          }
        });
      }, { threshold: 0 });
      observer.observe(ctaEl);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }

    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = () => {
    if (!listing) return;
    addItem({
      id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
      sku_id: listing.id,
      listing_id: listing.id,
      title: listing.title,
      price: listing.price,
      qty: 1,
      image_url: listing.images.length > 0 ? getImageUrl(listing.images[0].storage_key) ?? '' : '',
      notes: listing.description ?? '',
      in_stock: true,
      expires_at: null,
    });
    setCartDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white relative pb-16 md:pb-0">
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
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
              {listing.images.length > 0 && getImageUrl(listing.images[0].storage_key) ? (
                <LuxuryImage
                  src={getImageUrl(listing.images[0].storage_key) as string}
                  alt={listing.title}
                  className="object-cover w-full h-full"
                  priority
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
                <p className="text-sm text-muted/70 leading-relaxed max-w-md">
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
                ref={mainCtaRef}
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 text-xs tracking-widest border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0705] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
              >
                ADD TO CART →
              </button>

              {/* Additional images */}
              {listing.images.length > 1 && (
                <div className="flex gap-3 pt-2">
                  {listing.images.slice(1, 5).map((img) => {
                    const url = getImageUrl(img.storage_key);
                    return url ? (
                      <div
                        key={img.id}
                        className="w-16 h-16 overflow-hidden border border-[#2a2a2a] hover:border-[#c9a96e]/40 transition cursor-pointer"
                      >
                        <LuxuryImage
                          src={url}
                          alt={listing.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      {!isLoading && listing && (
        <div 
          className={`fixed bottom-0 left-0 right-0 h-16 bg-[#0a0705]/90 backdrop-blur border-t border-[#2a2a2a] z-50 flex items-center px-4 gap-4 transition-transform duration-300 md:hidden ${
            showStickyBar ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-[#e8dcc8] truncate">{listing.title}</h3>
            <p className="text-xs text-[#c9a96e]">
              INR {parseFloat(listing.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 max-w-[140px] h-10 bg-[#c9a96e] text-black text-xs font-medium tracking-widest uppercase hover:bg-[#b0935d] transition-colors"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
