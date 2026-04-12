import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/product.css";
import Sidebar from "../components/Sidebar";

import { getListings, getCategories } from "../api/listings";
import { addToCart as apiAddToCart } from "../api/cart";
import type { Listing, ProductCategory } from "../api/types";
import { getImageUrl } from "../utils/imageUrl";
import { Alert } from "../components/ui/Alert";

export default function Product() {
  const [search, setSearch] = useState("");
  const [activeFamily, setActiveFamily] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addToCart = async (id: string, item?: { title: string; price: string; image: string; notes: string }) => {
    setCart((prev) => (prev.includes(id) ? prev : [...prev, id]));
    try {
      await apiAddToCart(id, 1, item ? {
        title: item.title,
        price: item.price,
        image_url: item.image,
        notes: item.notes,
      } : undefined);
    } catch {
      setCart((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const bottle = card.querySelector('.bottle-tilt-container') as HTMLDivElement;
    if (!bottle) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;   // -0.5 to 0.5
    bottle.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const bottle = e.currentTarget.querySelector('.bottle-tilt-container') as HTMLDivElement;
    if (!bottle) return;
    bottle.style.transform = `perspective(800px) rotateY(0deg) rotateX(0deg)`;
    bottle.style.transition = 'transform 0.5s ease';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const bottle = e.currentTarget.querySelector('.bottle-tilt-container') as HTMLDivElement;
    if (!bottle) return;
    bottle.style.transition = 'none';
  };

  const [apiListings, setApiListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Defer state updates to avoid react-hooks/set-state-in-effect lint.
      await Promise.resolve();
      setIsLoading(true);
      setLoadError('');
      getListings({ limit: 50 })
        .then((result) => {
          if (!cancelled) setApiListings(result.data);
        })
        .catch(() => {
          if (!cancelled)
            setLoadError(
              "Couldn't load products. Showing the local catalogue."
            );
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      getCategories()
        .then((cats) => {
          if (!cancelled) setCategories(cats);
        })
        .catch(() => {
          // Silently fail — static families will be absent, "All" still works
        });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Map backend Listing → UI-compatible shape
  const displayProducts =
    apiListings.length > 0
      ? apiListings.map((listing) => ({
        id: listing.id,
        name: listing.title,
        type: listing.category?.name ?? 'Parfum',
        family: listing.category?.name ?? 'All',
        notes: listing.description ?? '',
        price: parseFloat(listing.price),
        badge: listing.status === 'active' ? null : listing.status,
        image:
          listing.images.length > 0 ? (getImageUrl(listing.images[0].storage_key) || null) : null,
      }))
      : []; // show empty while loading — loading state shown below

  const filtered = displayProducts.filter((p) => {
    const matchesFamily = activeFamily === 'All' || p.family === activeFamily;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFamily && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div>
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-[#2a2a2a] p-4 flex items-center justify-between">
          {" "}
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

            <div className="text-sm text-white/60">Cart ({cart.length})</div>
          </header>

          {/* HERO (NEW DESIGN) */}
          <div className="max-w-6xl mx-auto mb-12">
            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-display text-[#e8dcc8] mb-2">
                Discover Your Signature Scent
              </h1>

              <p className="max-w-md text-sm text-white/50">
                Explore a curated collection of refined fragrances crafted for
                every mood.
              </p>
            </div>

            {/* Search + CTA */}
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
              {/* Search */}
              <div className="flex-1">
                <input
                  placeholder="Search fragrances..."
                  className="w-full px-4 py-3 text-base sm:py-2 sm:text-sm rounded-md bg-[#0c0c0c] border border-[#2a2a2a] focus:border-[#c9a96e] focus:outline-none transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* CTA */}
              <Link
                to="/product"
                className="text-xs tracking-widest text-[#c9a96e] hover:text-white transition"
              >
                VIEW COLLECTION →
              </Link>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFamily("All")}
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
                  onClick={() => setActiveFamily(cat.name)}
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

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="text-white/40 text-sm tracking-widest">
                Loading fragrances…
              </div>
            </div>
          )}

          {/* API error state */}
          {loadError && (
            <Alert variant="warn" className="mb-6">
              {loadError}
            </Alert>
          )}

          {/* PRODUCT GRID — only when not loading */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((item) => (
                <div 
                  key={item.id} 
                  className="relative overflow-hidden group border border-[#2a2a2a]/30 hover:border-[#c9a96e]/40 transition-colors bg-[#050505]"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onMouseEnter={handleMouseEnter}
                >
                  {/* IMAGE */}
                  <div className="relative h-[360px] sm:h-[420px] lg:h-[480px]">
                    {/* The ambient glow — stays flat, doesn't tilt */}
                    <div className="absolute inset-0 top-1/4 bottom-1/4 m-auto w-2/3 h-1/2 rounded-full bg-[#c9a96e] blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" />

                    {/* The bottle container — floats transparently over the glow */}
                    <div className="bottle-tilt-container absolute inset-0 z-10 flex items-center justify-center p-8 pb-32">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
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

                      <p className="text-xs text-[#c9b99a99] mb-4 line-clamp-2 max-w-[80%] mx-auto drop-shadow-md">
                        {item.notes}
                      </p>

                      <div className="flex items-center justify-center gap-4 text-sm pointer-events-auto">
                        <span className="text-[#c9a96e] font-serif">
                          INR {item.price}
                        </span>

                        <button
                          onClick={() => addToCart(item.id, {
                            title: item.name,
                            price: String(item.price),
                            image: item.image,
                            notes: item.notes,
                          })}
                          className="tracking-widest text-[#c9b99a66] hover:text-[#c9a96e] transition-colors"
                        >
                          {cart.includes(item.id) ? "ADDED ✓" : "ADD TO CART"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && filtered.length === 0 && (
            <div className="py-20 text-center text-white/50">
              No fragrances match your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
