import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import WishlistItemCard from "../components/wishlist-components/WishlistItemCard";
import WishlistSummary from "../components/wishlist-components/WishlistSummary";
import WishlistBenefits from "../components/wishlist-components/WishlistBenefits";
import WishlistRecommended from "../components/wishlist-components/WishlistRecommended";

import { useCart } from "../context/CartContext";

import { Heart, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";

interface WishlistItem {
  id: string;
  name: string;
  type: string;
  price: number;
  image: string;
  notes: string;
  inStock: boolean;
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem('hadi_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hadi_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const removeFromWishlist = (id: string | number) => {
    setWishlistItems((items) => items.filter((item) => item.id !== String(id)));
  };

  const { addItem } = useCart();

  const addToCartHandler = (id: string | number) => {
    setAddedToCart(String(id));
    const itemToAdd = wishlistItems.find((w) => w.id === String(id));
    if (itemToAdd) {
      addItem({
        id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
        sku_id: itemToAdd.id,
        listing_id: itemToAdd.id,
        title: itemToAdd.name,
        price: String(itemToAdd.price),
        qty: 1,
        image_url: itemToAdd.image,
        notes: itemToAdd.notes,
        in_stock: true,
        expires_at: null,
      });
    }
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const moveAllToCart = async () => {
    // 1. Safe Bulk Action
    const results = await Promise.allSettled(
      wishlistItems.map((item) =>
        new Promise<void>((resolve, reject) => {
          try {
            addItem({
              id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
              sku_id: item.id,
              listing_id: item.id,
              title: item.name,
              price: String(item.price),
              qty: 1,
              image_url: item.image,
              notes: item.notes,
              in_stock: true,
              expires_at: null,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        })
      )
    );

    // Filter fulfilled -> remove from wishlist safely
    const fulfilledIndexes = results
      .map((res, i) => (res.status === 'fulfilled' ? i : -1))
      .filter((i) => i !== -1);
      
    if (fulfilledIndexes.length > 0) {
      setWishlistItems((prev) => prev.filter((_, i) => !fulfilledIndexes.includes(i)));
    }

    // Rejected check
    const rejectedCount = results.filter((res) => res.status === 'rejected').length;
    if (rejectedCount > 0) {
       // Assuming we have a toast, otherwise standard alert/log per your design
       alert(`${rejectedCount} items couldn't be added. Try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif">
      <Sidebar
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 p-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg
            className="w-6 h-6 text-[#e8dcc8]"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-sm text-[#c9a96e]">Wishlist</span>
      </div>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-noise" />
      </div>

      <div className="relative px-4 py-8 mx-auto max-w-7xl md:px-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/product"
            className="flex gap-2 py-2 text-[#c9a96e]/70 hover:text-[#c9a96e]"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <div className="flex gap-2">
            <Heart className="w-5 h-5 text-[#c9a96e]" />
            <span>{wishlistItems.length} Items</span>
          </div>
        </div>

        <h1 className="mb-8 text-4xl">
          My <span className="text-[#c9a96e]">Wishlist</span>
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="py-20 text-center">
            {/* Soft breathing animated icon */}
            <div className="w-20 h-20 mx-auto bg-[#c9a96e]/10 rounded-full flex items-center justify-center mb-8 animate-[pulse_2s_ease-in-out_infinite]">
              <Heart className="w-8 h-8 text-[#c9a96e]" strokeWidth={1} />
            </div>
            
            {/* Emotional Empty States */}
            <h2 className="text-3xl md:text-4xl font-display text-[#e8dcc8] mb-4">
              Your signature scent is waiting to be discovered.
            </h2>
            <p className="text-white/50 max-w-md mx-auto mb-16">
              Our master perfumers have curated these for you.
            </p>

            {/* Perfumer's Picks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
              {[
                { id: "pick-1", name: "Oud Royale", price: 250, image: "/images/product-1.jpg" },
                { id: "pick-2", name: "Amber D'Or", price: 180, image: "/images/product-2.jpg" },
                { id: "pick-3", name: "Midnight Musk", price: 210, image: "/images/product-3.jpg" },
              ].map(pick => (
                <div key={pick.id} className="border border-[#c9a96e]/10 rounded-lg p-4 bg-white/5 group hover:border-[#c9a96e]/40 transition">
                  <div className="w-full aspect-[4/5] overflow-hidden rounded-md mb-4 bg-black/50">
                     <img src={pick.image} alt={pick.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700" />
                  </div>
                  <h3 className="text-[#e8dcc8] mb-1">{pick.name}</h3>
                  <p className="text-sm text-[#c9a96e] mb-4">INR {pick.price}</p>
                  <Link to="/product" className="block w-full py-2 text-center text-xs tracking-widest uppercase border border-[#c9a96e]/20 text-[#e8dcc8] hover:bg-[#c9a96e] hover:text-black transition">
                    Explore Collection
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* LEFT */}
            <div className="space-y-4 lg:col-span-2">
              {wishlistItems.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  addToCart={addToCartHandler}
                  removeFromWishlist={removeFromWishlist}
                  addedToCart={addedToCart}
                />
              ))}
            </div>

            {/* RIGHT */}
            <div className="sticky space-y-6 top-8">
              <WishlistSummary items={wishlistItems} />
              <WishlistBenefits />
              <WishlistRecommended />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
