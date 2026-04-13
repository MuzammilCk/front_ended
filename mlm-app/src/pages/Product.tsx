import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as Slider from "@radix-ui/react-slider";
import gsap from "gsap";
import "../styles/product.css";
import Sidebar from "../components/Sidebar";

import { getListings, getCategories } from "../api/listings";
import type { Listing, ProductCategory } from "../api/types";
import { useCart } from "../context/CartContext";
import LuxuryImage from "../components/ui/LuxuryImage";
import { getImageUrl } from "../utils/imageUrl";
import { Alert } from "../components/ui/Alert";

export default function Product() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL synced state
  const search = searchParams.get("q") || "";
  const activeFamily = searchParams.get("family") || "All";
  const activeSort = searchParams.get("sort") || "newest";
  const intensityFilter = searchParams.get("intensity") || "All";
  const priceMin = Number(searchParams.get("min")) || 0;
  const priceMax = Number(searchParams.get("max")) || 15000;

  const updateSearchParam = (key: string, value: string | number) => {
    const next = new URLSearchParams(searchParams);
    if (value !== "" && value !== "All") next.set(key, String(value));
    else next.delete(key);
    setSearchParams(next);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const { addItem, items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);

  // Pagination & Data State
  const [apiListings, setApiListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for Tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLDivElement;
      const bottle = card.querySelector('.bottle-tilt-container') as HTMLDivElement;
      if (!bottle) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      bottle.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const bottle = (e.currentTarget as HTMLDivElement).querySelector('.bottle-tilt-container') as HTMLDivElement;
      if (!bottle) return;
      bottle.style.transform = `perspective(800px) rotateY(0deg) rotateX(0deg)`;
      bottle.style.transition = 'transform 0.5s ease';
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const bottle = (e.currentTarget as HTMLDivElement).querySelector('.bottle-tilt-container') as HTMLDivElement;
      if (!bottle) return;
      bottle.style.transition = 'none';
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target as HTMLDivElement;
        if (entry.isIntersecting) {
          card.addEventListener('mousemove', handleMouseMove);
          card.addEventListener('mouseleave', handleMouseLeave);
          card.addEventListener('mouseenter', handleMouseEnter);
        } else {
          card.removeEventListener('mousemove', handleMouseMove);
          card.removeEventListener('mouseleave', handleMouseLeave);
          card.removeEventListener('mouseenter', handleMouseEnter);
          
          const bottle = card.querySelector('.bottle-tilt-container') as HTMLDivElement;
          if (bottle) {
             bottle.style.transform = `perspective(800px) rotateY(0deg) rotateX(0deg)`;
             bottle.style.transition = 'transform 0.5s ease';
          }
        }
      });
    }, { threshold: 0.3 });

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(c => observer.observe(c));

    return () => {
      observer.disconnect();
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, [apiListings]);

  // Data Fetching
  const fetchListings = async (pageNum: number) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await getListings({ limit: 12, page: pageNum });
      if (pageNum === 1) {
        setApiListings(result.data);
      } else {
        setApiListings(prev => [...prev, ...result.data]);
      }
      setHasMore(result.data.length === 12);
    } catch {
      setLoadError("Couldn't load products. Showing what we have.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
    setPage(1);

    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage(p => {
          const next = p + 1;
          void fetchListings(next);
          return next;
        });
      }
    }, { rootMargin: '200px' });
    
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAddToCart = (e: React.MouseEvent, item: { id: string, title: string; price: string; image: string; notes: string }) => {
    // 1. Add to context
    addItem({
      id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
      sku_id: item.id,
      listing_id: item.id,
      title: item.title,
      price: item.price,
      qty: 1,
      image_url: item.image,
      notes: item.notes,
      in_stock: true,
      expires_at: null,
    });

    // 2. Fly to cart animation
    const button = e.currentTarget as HTMLButtonElement;
    const card = button.closest('.product-card');
    if (!card) return;
    
    const imageContainer = card.querySelector('.bottle-tilt-container img');
    const cartIcon = document.querySelector('.cart-icon-target');
    if (!imageContainer || !cartIcon) return;

    const imgRect = imageContainer.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const clone = document.createElement('img');
    clone.src = (imageContainer as HTMLImageElement).src;
    clone.style.position = 'fixed';
    clone.style.top = `${imgRect.top}px`;
    clone.style.left = `${imgRect.left}px`;
    clone.style.width = `${imgRect.width}px`;
    clone.style.height = `${imgRect.height}px`;
    clone.style.objectFit = 'contain';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);

    gsap.to(clone, {
      x: cartRect.left - imgRect.left + cartRect.width / 2 - imgRect.width / 2,
      y: cartRect.top - imgRect.top + cartRect.height / 2 - imgRect.height / 2,
      scale: 0.2,
      opacity: 0.5,
      duration: 0.7,
      ease: "power3.in",
      onComplete: () => {
        clone.remove();
        gsap.fromTo(cartIcon, 
          { scale: 1 }, 
          { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" }
        );
      }
    });
  };

  // Map backend Listing → UI-compatible shape
  const displayProducts = useMemo(() => {
    return apiListings.map((listing) => {
      let intensityStr = "Moderate";
      if (listing.description?.toLowerCase().includes('intense') || listing.category?.name === 'Oud') intensityStr = "Intense";
      else if (listing.description?.toLowerCase().includes('soft') || listing.category?.name === 'Floral') intensityStr = "Soft";

      return {
        id: listing.id,
        name: listing.title,
        type: listing.category?.name ?? 'Parfum',
        family: listing.category?.name ?? 'All',
        notes: listing.description ?? '',
        price: parseFloat(listing.price),
        badge: listing.status === 'active' ? null : listing.status,
        image: listing.images.length > 0 ? (getImageUrl(listing.images[0].storage_key) || null) : null,
        intensity: intensityStr
      };
    });
  }, [apiListings]);

  const filtered = useMemo(() => {
    let result = displayProducts.filter((p) => {
      const matchesFamily = activeFamily === 'All' || p.family === activeFamily;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesIntensity = intensityFilter === 'All' || p.intensity === intensityFilter;
      const matchesPrice = p.price >= priceMin && p.price <= priceMax;
      return matchesFamily && matchesSearch && matchesIntensity && matchesPrice;
    });

    if (activeSort === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (activeSort === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (activeSort === 'best-sellers') result.sort((a, b) => a.name.localeCompare(b.name)); // simple mock

    return result;
  }, [displayProducts, activeFamily, search, intensityFilter, priceMin, priceMax, activeSort]);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div>
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-[#2a2a2a] p-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-8 text-white sm:px-6 sm:py-10 md:px-12">
          {/* HEADER */}
          <header className="flex items-center justify-between mb-12">
            <Link to="/" className="text-xl tracking-wide font-display">
              HADI
            </Link>

            <div 
              className="cart-icon-target text-sm text-white/60 cursor-pointer hover:text-[#c9a96e] transition"
              onClick={() => setIsSidebarOpen(true)}
            >
              Cart ({cartCount})
            </div>
          </header>

          {/* HERO */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-display text-[#e8dcc8] mb-2">
                Discover Your Signature Scent
              </h1>
              <p className="max-w-md text-sm text-white/50">
                Explore a curated collection of refined fragrances crafted for every mood.
              </p>
            </div>

            {/* FILTERS TOP ROW: Search, Sort */}
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center justify-between border-b border-[#2a2a2a] pb-6">
              <div className="flex-1 max-w-sm">
                <input
                  placeholder="Search fragrances..."
                  className="w-full px-4 py-3 text-base sm:py-2 sm:text-sm rounded-md bg-[#0c0c0c] border border-[#2a2a2a] focus:border-[#c9a96e] focus:outline-none transition"
                  value={search}
                  onChange={(e) => updateSearchParam("q", e.target.value)}
                />
              </div>

              <div className="w-full md:w-48">
                <select 
                  className="w-full bg-[#0c0c0c] border border-[#2a2a2a] text-sm text-white/80 py-2 sm:py-2 px-4 rounded-md focus:border-[#c9a96e] focus:outline-none"
                  value={activeSort}
                  onChange={(e) => updateSearchParam("sort", e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="best-sellers">Best Sellers</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* FILTERS BOTTOM ROW: Family, Intensity, Price Range */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-6">
              
              {/* Family */}
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Family</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateSearchParam("family", "All")}
                    className={`px-4 py-1.5 text-xs rounded-full border transition-all ${activeFamily === "All"
                        ? "bg-[#c9a96e] text-black border-[#c9a96e]"
                        : "border-[#2a2a2a] text-white/60 hover:border-[#c9a96e] hover:text-white"
                      }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateSearchParam("family", cat.name)}
                      className={`px-4 py-1.5 text-xs rounded-full border transition-all ${activeFamily === cat.name
                          ? "bg-[#c9a96e] text-black border-[#c9a96e]"
                          : "border-[#2a2a2a] text-white/60 hover:border-[#c9a96e] hover:text-white"
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div className="flex-shrink-0">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Intensity</p>
                 <div className="flex bg-[#0c0c0c] border border-[#2a2a2a] rounded-full p-1">
                    {["All", "Soft", "Moderate", "Intense"].map((intense) => (
                      <button
                        key={intense}
                        onClick={() => updateSearchParam("intensity", intense)}
                        className={`px-4 py-1 text-xs rounded-full transition-colors ${intensityFilter === intense ? 'bg-[#2a2a2a] text-[#c9a96e]' : 'text-white/40 hover:text-white'}`}
                      >
                        {intense}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Price Range */}
              <div className="flex-shrink-0 w-full lg:w-48">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 flex justify-between">
                   <span>Price Range</span>
                   <span className="text-[#c9a96e]">INR {priceMin} - {priceMax}</span>
                 </p>
                 <Slider.Root 
                   className="relative flex items-center select-none touch-none w-full h-4" 
                   value={[priceMin, priceMax]} 
                   onValueChange={([min, max]) => {
                     updateSearchParam("min", min);
                     updateSearchParam("max", max);
                   }} 
                   max={15000} 
                   step={100}
                 >
                   <Slider.Track className="bg-[#2a2a2a] relative grow rounded-full h-[2px]">
                     <Slider.Range className="absolute bg-[#c9a96e] rounded-full h-full" />
                   </Slider.Track>
                   <Slider.Thumb className="block w-4 h-4 bg-[#e8dcc8] rounded-full hover:bg-white focus:outline-none border-2 border-black" />
                   <Slider.Thumb className="block w-4 h-4 bg-[#e8dcc8] rounded-full hover:bg-white focus:outline-none border-2 border-black" />
                 </Slider.Root>
              </div>

            </div>
          </div>

          {/* API error state */}
          {loadError && (
            <Alert variant="warn" className="mb-6 max-w-6xl mx-auto">
              {loadError}
            </Alert>
          )}

          {/* PRODUCT GRID */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((item) => (
              <div 
                key={item.id} 
                className="product-card relative overflow-hidden group border border-[#2a2a2a]/30 hover:border-[#c9a96e]/40 transition-colors bg-[#050505]"
              >
                {/* IMAGE */}
                <div className="relative h-[360px] sm:h-[420px] lg:h-[480px]">
                  {/* The ambient glow — stays flat, doesn't tilt */}
                  <div className="absolute inset-0 top-1/4 bottom-1/4 m-auto w-2/3 h-1/2 rounded-full bg-[#c9a96e] blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" />

                  {/* The bottle container — floats transparently over the glow */}
                  <div className="bottle-tilt-container absolute inset-0 z-10 flex items-center justify-center p-8 pb-32">
                    {item.image ? (
                      <LuxuryImage
                        src={item.image}
                        alt={item.name}
                        className="object-contain w-full h-full drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-20 h-40 border border-[#c9a96e]/25 bg-gradient-to-b from-[#c9a96e]/10 to-transparent flex items-center justify-center text-[10px] text-[#c9a96e]/50">NO IMAGE</div>
                    )}
                  </div>

                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-20" />

                  {/* BADGE */}
                  {item.badge && (
                    <div className="absolute top-4 left-4 z-30">
                      <span className="px-3 py-1 text-[10px] tracking-widest text-[#c9a96e] bg-black/50 backdrop-blur-sm border border-[#c9a96e44]">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(item.id)}
                    type="button"
                    aria-label={
                      wishlist.includes(item.id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    className={`absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${wishlist.includes(item.id)
                        ? "bg-red-500 text-white"
                        : "bg-black/60 text-white/80 hover:bg-[#c9a96e] hover:text-black"
                      }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={wishlist.includes(item.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  {/* CONTENT */}
                  <div className="absolute left-0 w-full px-6 text-center bottom-6 z-30 pointer-events-none">
                    <p className="text-[10px] tracking-[0.3em] text-[#c9a96e66] mb-2 drop-shadow-md">
                      {item.type}
                    </p>

                    <h2 className="text-2xl font-display text-[#e8dcc8] mb-2 drop-shadow-md pointer-events-auto">
                      <Link to={`/product/${item.id}`} className="hover:text-white transition-colors">{item.name}</Link>
                    </h2>

                    <p className="text-xs text-[#ddcca899] mb-4 line-clamp-2 max-w-[80%] mx-auto drop-shadow-md">
                      {item.notes}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-sm pointer-events-auto">
                      <span className="text-[#c9a96e] font-serif">
                        INR {item.price}
                      </span>

                      <button
                        onClick={(e) => handleAddToCart(e, {
                          id: item.id,
                          title: item.name,
                          price: String(item.price),
                          image: item.image ?? "",
                          notes: item.notes,
                        })}
                        className="tracking-widest text-[#ddcca866] hover:text-[#c9a96e] transition-colors"
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SKELETON LOADER (Infinite Scroll) */}
          {isLoading && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[360px] sm:h-[420px] lg:h-[480px] bg-[#0c0c0c] border border-[#2a2a2a] relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {/* INFINITE SCROLL SENTINEL */}
          {!isLoading && hasMore && (
            <div ref={sentinelRef} className="h-10 w-full mt-4" />
          )}

          {/* EMPTY STATE */}
          {!isLoading && filtered.length === 0 && (
             <div className="py-20 text-center text-white/50 w-full">
               No fragrances match your criteria
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
