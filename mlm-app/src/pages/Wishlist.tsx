import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import WishlistItemCard from "../components/wishlist-components/WishlistItemCard";
import WishlistSummary from "../components/wishlist-components/WishlistSummary";
import WishlistBenefits from "../components/wishlist-components/WishlistBenefits";
import WishlistRecommended from "../components/wishlist-components/WishlistRecommended";

import { addToCart as apiAddToCart } from "../api/cart";

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

  const addToCartHandler = (id: string | number) => {
    setAddedToCart(String(id));
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const moveAllToCart = async () => {
    let successCount = 0;
    for (const item of wishlistItems) {
      try {
        await apiAddToCart(item.id, 1);
        successCount++;
      } catch {
        // Skip items that fail (e.g. out of stock)
      }
    }
    if (successCount > 0) {
      setWishlistItems([]);
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
            <Heart className="w-20 h-20 mx-auto text-[#c9a96e]/30 mb-6" />
            <h2>Your wishlist is empty. Save fragrances to buy later.</h2>
            <Link to="/product" className="bg-[#c9a96e] px-6 py-3 rounded-lg">
              Explore Collection
            </Link>
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
