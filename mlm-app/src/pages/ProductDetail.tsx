import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronDown, Plus, Minus, Star, Shield, Truck, ArrowLeft } from "lucide-react";
import { getListingById } from "../api/listings";
import type { Listing } from "../api/types";
import { useCart } from "../context/CartContext";
import LuxuryImage from "../components/ui/LuxuryImage";
import { getImageUrl } from "../utils/imageUrl";
import { Alert } from "../components/ui/Alert";
import Sidebar from "../components/Sidebar";
import { MAX_QTY_PER_ITEM } from "../constants/cart.constants";

import CartDrawer from "../components/Cart-components/CartDrawer";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-[#c9a96e]/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 text-left
                   transition-colors hover:text-[#c9a96e] focus:outline-none"
      >
        <span className="text-label text-text-primary">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#c9a96e] transition-transform duration-300
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ maxHeight: isOpen ? (contentRef.current?.scrollHeight ?? 500) + 'px' : '0px' }}
      >
        <div className="pb-6 text-sm text-white/60 leading-relaxed font-sans space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  const mainCtaRef = useRef<HTMLButtonElement>(null);

  const { addItem, items } = useCart();

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

  useEffect(() => {
    const ctaEl = mainCtaRef.current;
    if (!ctaEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar only when CTA has scrolled above viewport
        setShowStickyBar(entry.boundingClientRect.top < 0 && !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(ctaEl);
    return () => observer.disconnect();
  }, [listing]);

  const handleAddToCart = () => {
    if (!listing || isAdding) return;
    setIsAdding(true);

    setTimeout(() => {
      addItem({
        id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
        sku_id: listing.id,
        listing_id: listing.id,
        title: listing.title,
        price: listing.price,
        qty: quantity,
        image_url: listing.images.length > 0
          ? getImageUrl(listing.images[0].storage_key) ?? ''
          : '',
        notes: listing.description ?? '',
        in_stock: listing.status === 'active' && listing.quantity > 0,
        expires_at: null,
      });
      setIsAdding(false);
      setCartDrawerOpen(true);
    }, 380);
  };

  return (
    <div className="min-h-screen bg-void text-text-primary relative pt-16">
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Top bar */}
      <nav className="fixed top-0 w-full z-40 bg-void/80 backdrop-blur-xl
                      border-b border-sand/10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

          {/* Left: Hamburger + Back */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-2 text-white/70 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <Link
              to="/product"
              className="hidden md:flex items-center gap-1.5 text-label
                         text-sand/70 hover:text-sand transition"
            >
              <ArrowLeft className="w-3 h-3" /> Collection
            </Link>
          </div>

          {/* Center: Brand wordmark */}
          <Link
            to="/"
            className="font-display text-2xl tracking-widest text-[#e8dcc8]
                       absolute left-1/2 -translate-x-1/2"
          >
            HADI
          </Link>

          {/* Right: Cart count */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="text-label text-white/70 hover:text-white transition"
          >
            Cart ({items.reduce((acc, i) => acc + i.qty, 0)})
          </button>
        </div>
      </nav>

      <div className="px-4 section-padding sm:px-6 md:px-12 max-w-7xl mx-auto">

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
          <div className="flex flex-col lg:flex-row min-h-screen">

            {/* LEFT: Image Stack — 60% on desktop, full width on mobile */}
            <div className="w-full lg:w-[60%] lg:border-r border-[#c9a96e]/10">
              <div className="flex flex-col gap-[2px] bg-[#c9a96e]/5">

                {/* Hero image — aspect 4/5 on mobile, square on tablet, 4/5 on desktop */}
                <div className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5] bg-[#0d0a07]">
                  {listing.images.length > 0 && getImageUrl(listing.images[0].storage_key) ? (
                    <LuxuryImage
                      src={getImageUrl(listing.images[0].storage_key) as string}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/50 text-xs tracking-widest uppercase">No image</span>
                    </div>
                  )}
                  {listing.status !== 'active' && (
                    <div className="absolute top-6 left-6 bg-rose-500/10 border border-rose-500/20
                                    px-3 py-1 text-[10px] uppercase tracking-widest text-rose-400 backdrop-blur-md">
                      {listing.status.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Additional images — 2-column grid below hero */}
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-2 gap-[2px]">
                    {listing.images.slice(1, 5).map((img) => {
                      const url = getImageUrl(img.storage_key);
                      return url ? (
                        <div key={img.id} className="relative aspect-[4/5] bg-[#0d0a07]">
                          <LuxuryImage src={url} alt={listing.title} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Sticky Info Rail — 40% on desktop */}
            <div className="w-full lg:w-[40%] relative">
              <div className="lg:sticky lg:top-16 p-6 md:p-10 lg:h-[calc(100vh-64px)] lg:overflow-y-auto">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-label text-white/40 mb-8">
                  <Link to="/" className="hover:text-sand transition">Home</Link>
                  <span className="opacity-40">/</span>
                  <Link to="/product" className="hover:text-sand transition">
                    {listing.category?.name || 'Collection'}
                  </Link>
                  <span className="opacity-40">/</span>
                  <span className="text-sand truncate max-w-[120px]">{listing.sku}</span>
                </div>

                {/* Title + Price */}
                <div className="mb-8">
                  <h1 className="text-display text-4xl md:text-5xl text-text-primary mb-4">
                    {listing.title}
                  </h1>
                  <p className="font-sans text-2xl text-[#c9a96e] font-light tracking-wide">
                    INR {parseFloat(listing.price).toLocaleString('en-IN', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })}
                  </p>
                  {/* Star Rating */}
                  <div className="flex items-center gap-2 mb-6 mt-3">
                    <div className="flex text-[#c9a96e]">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-sans text-white/40 hover:text-white/70
                                     transition cursor-pointer underline underline-offset-2">
                      124 Reviews
                    </span>
                  </div>
                </div>

                {/* Description */}
                {listing.description && (
                  <p className="font-sans text-sm text-white/60 leading-relaxed mb-8 max-w-md">
                    {listing.description}
                  </p>
                )}

                {/* Accordion Blocks */}
                <div className="mt-2 mb-8 border-t border-[#c9a96e]/20 pt-2">
                  <Accordion title="Olfactory Pyramid" defaultOpen={true}>
                    <div className="space-y-3">
                      <p>
                        <span className="text-[#c9a96e] text-[10px] uppercase tracking-widest block mb-1">
                          Top Notes
                        </span>
                        Bergamot · Pink Pepper · Saffron
                      </p>
                      <p>
                        <span className="text-[#c9a96e] text-[10px] uppercase tracking-widest block mb-1">
                          Heart Notes
                        </span>
                        Turkish Rose · Iris · Vetiver
                      </p>
                      <p>
                        <span className="text-[#c9a96e] text-[10px] uppercase tracking-widest block mb-1">
                          Base Notes
                        </span>
                        Cambodian Oud · Amber · Vanilla
                      </p>
                    </div>
                  </Accordion>

                  <Accordion title="Ingredients & Care">
                    <p>
                      Alcohol Denat., Parfum (Fragrance), Aqua, Limonene, Linalool, Citronellol.
                      Store away from direct sunlight and heat. Keep tightly capped when not in use.
                    </p>
                  </Accordion>

                  <Accordion title="Shipping & Returns">
                    <p>
                      Complimentary express shipping on all orders over INR 15,000.
                      Returns accepted within 14 days of delivery, provided the seal remains unbroken.
                      Free returns on all authenticated fragrances.
                    </p>
                  </Accordion>
                </div>

                <div className="flex items-end gap-4 mb-6">
                  {/* Volume badge (static — could be made dynamic later) */}
                  <div className="flex-1">
                    <span className="block text-label text-white/50 mb-2">Volume</span>
                    <div className="border border-sand/30 px-4 py-3 text-center
                                    text-label bg-sand/5 text-sand">
                      50 ML
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div>
                    <span className="block text-label text-white/50 mb-2">Quantity</span>
                    <div className="flex items-center border border-[#2a2a2a]">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-sans text-sm text-[#e8dcc8]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(quantity + 1, Math.min(listing.quantity, MAX_QTY_PER_ITEM)))}
                        disabled={quantity >= Math.min(listing.quantity, MAX_QTY_PER_ITEM)}
                        className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {quantity >= Math.min(listing.quantity, MAX_QTY_PER_ITEM) && (
                      <p className="text-[10px] text-amber-400/70 font-sans mt-1.5">
                        Max {Math.min(listing.quantity, MAX_QTY_PER_ITEM)} available
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to Cart CTA — keep the existing ref and onClick */}
                <button
                  ref={mainCtaRef}
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding || listing.status !== 'active'}
                  className={`w-full btn-primary px-0 text-sm py-4
                    ${listing.status !== 'active'
                      ? 'bg-[#2a2a2a] text-white/30 cursor-not-allowed border-none'
                      : isAdding
                        ? 'bg-[#e8c87a] text-black scale-[0.98] cursor-not-allowed'
                        : ''}`}
                >
                  {isAdding ? 'Adding...' : listing.status !== 'active' ? listing.status.replace('_', ' ') : 'Add to Bag'}
                </button>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#c9a96e]/20">
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-[#c9a96e] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="font-sans text-[10px] text-[#e8dcc8] uppercase tracking-widest mb-0.5">
                        Free Shipping
                      </p>
                      <p className="font-sans text-[10px] text-white/40">
                        Orders above INR 15,000
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#c9a96e] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="font-sans text-[10px] text-[#e8dcc8] uppercase tracking-widest mb-0.5">
                        Authenticated
                      </p>
                      <p className="font-sans text-[10px] text-white/40">
                        Sourced from Grasse
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      {!isLoading && listing && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0a0705]/95 backdrop-blur-xl
          border-t border-[#c9a96e]/20 p-4 md:hidden transition-transform duration-300
          ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-[#e8dcc8] truncate">{listing!.title}</p>
              <p className="font-sans text-xs text-[#c9a96e]">
                INR {(parseFloat(listing!.price) * quantity).toLocaleString('en-IN', {
                  minimumFractionDigits: 2
                })}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || listing!.status !== 'active'}
              className="bg-[#c9a96e] text-black px-6 py-3 font-sans text-[10px]
                         font-medium uppercase tracking-widest disabled:opacity-50
                         transition hover:bg-[#e8c87a] active:scale-[0.98]"
            >
              {isAdding ? '...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
