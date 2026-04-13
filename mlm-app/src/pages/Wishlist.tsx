import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist, type WishlistItem } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import WishlistItemCard from "../components/wishlist-components/WishlistItemCard";
import Sidebar from "../components/Sidebar";
import { ArrowLeft, Heart } from "lucide-react";

export default function Wishlist() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* STICKY NAVBAR — matching other pages in the project */}
      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]">
          MY WISHLIST
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          {wishlistCount} Items
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#0a0705]/90 backdrop-blur border border-[#c9a96e]/40 px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] shadow-2xl"
          style={{ animation: 'slideInDown 0.3s ease-out' }}
        >
          {toastMessage}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/product"
            className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#c9a96e]/70 hover:text-[#c9a96e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Shop</span>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-display text-[#e8dcc8]">My Wishlist</h1>
            <p className="text-xs tracking-widest text-white/40 mt-1 text-right">
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
            <h2 className="text-3xl font-display text-[#e8dcc8] mb-4">
              Your wishlist is empty.
            </h2>
            <p className="text-white/50 font-sans font-light mb-10 max-w-sm">
              Curate your personal collection of signature scents.
            </p>
            <Link
              to="/product"
              className="bg-[#c9a96e] text-black px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#e8dcc8] transition-colors"
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
