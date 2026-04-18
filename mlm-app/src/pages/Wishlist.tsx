import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist, type WishlistItem } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import WishlistItemCard from "../components/wishlist-components/WishlistItemCard";

import { ArrowLeft, Heart } from "lucide-react";

export default function Wishlist() {
  const [movingId, setMovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const { items: wishlistItems, count: wishlistCount, removeItem: removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (item: WishlistItem) => {
    setMovingId(item.id);
    setTimeout(() => {
      addItem({
        id: crypto.randomUUID?.() ?? `cart-${Date.now()}`,
        sku_id: item.id,
        listing_id: item.id,
        title: item.name,
        price: String(item.price),
        qty: 1,
        image_url: item.image,
        notes: item.notes,
        in_stock: item.inStock,
        expires_at: null,
      });
      removeFromWishlist(item.id);
      setMovingId(null);
      setToastMessage(`${item.name} moved to your bag`);
      setTimeout(() => setToastMessage(""), 3000);
    }, 400);
  };

  useEffect(() => {
    // Inject animation keyframes safely
    const styleId = "wishlist-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes slideInDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="min-h-screen bg-void text-[#e8dcc8] pb-20 md:pb-0">

      {/* STICKY NAVBAR — matching other pages in the project */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur-sm border-b border-[#c9a96e]/10 px-4 py-3 flex items-center justify-between">
        <div className="w-10"></div> {/* spacer for flex balance */}
        <div className="text-label text-sand">
          MY WISHLIST
        </div>
        <div className="text-label text-white/40">
          {wishlistCount} Items
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-sm bg-void/90 backdrop-blur border border-sand/40 p-4 text-label text-sand shadow-glass"
          style={{ animation: 'slideInDown 0.3s ease-out' }}
        >
          {toastMessage}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 section-padding">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/product"
            className="flex items-center gap-2 text-label text-sand/70 hover:text-sand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Shop</span>
          </Link>
          <div className="text-right">
            <h1 className="text-display text-4xl text-text-primary">My Wishlist</h1>
            <p className="text-label text-white/40 mt-1">
              {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}
        {wishlistCount === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-28 h-28 mb-8 flex items-center justify-center rounded-full bg-[#c9a96e]/5 border border-[#c9a96e]/20">
              <Heart className="w-16 h-16 text-[#c9a96e]/40" strokeWidth={1} />
            </div>
            <h2 className="text-display text-3xl text-text-primary mb-4">
              Your wishlist is empty.
            </h2>
            <p className="text-white/50 font-sans font-light mb-10 max-w-sm">
              Curate your personal collection of signature scents.
            </p>
            <Link
              to="/product"
              className="btn-primary px-10"
            >
              Discover Fragrances
            </Link>
          </div>
        ) : (
          /* PRODUCT GALLERY GRID */
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {wishlistItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                onMoveToCart={handleMoveToCart}
                onRemove={removeFromWishlist}
                isMoving={movingId === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
