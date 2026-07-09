import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";
import { useCart } from "../../context/CartContext";

export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  type: string;
  image?: string;
  listing_id?: string;
}

interface RecommendedProductsProps {
  products: RecommendedProduct[];
}

export default function RecommendedProducts({ products }: RecommendedProductsProps) {
  const { addItem } = useCart();

  if (!products || products.length === 0) {
    return null;
  }

  const handleAddToCart = (product: RecommendedProduct) => {
    addItem({
      id: product.id,
      sku_id: product.id,
      listing_id: product.listing_id || product.id,
      title: product.name,
      price: product.price.toString(),
      qty: 1,
      image_url: product.image || "",
      notes: product.type,
      in_stock: true,
      expires_at: null,
    });
  };

  return (
    <div className="mt-12 md:mt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl text-[#e8dcc8]">You May Also Like</h2>
          <div className="h-[1px] w-12 bg-[#c9a96e]/40 mt-3" />
        </div>
      </div>

      {/* MNC Fix: Horizontal Snap Scroll for Mobile, Grid for Desktop */}
      <div className="flex overflow-x-auto overscroll-x-contain scroll-px-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 snap-x snap-mandatory pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none][scrollbar-width:none]">
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[260px] sm:w-auto bg-[#0d0a07] border border-[#c9a96e]/10 hover:border-[#c9a96e]/30 transition-colors duration-300 flex flex-col rounded-lg overflow-hidden group"
          >
            <Link to={`/product/${product.listing_id || product.id}`} className="block aspect-[4/5] overflow-hidden relative">
              {product.image ? (
                <LuxuryImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#0d0a07] to-[#c9a96e]/10 flex items-center justify-center">
                  <span className="text-[#c9a96e]/30 text-xs tracking-widest uppercase">No Image</span>
                </div>
              )}
            </Link>

            <div className="p-5 flex flex-col flex-1">
              <Link to={`/product/${product.listing_id || product.id}`}>
                <h3 className="font-display text-[#e8dcc8] text-lg line-clamp-1 group-hover:text-[#c9a96e] transition-colors">{product.name}</h3>
              </Link>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1.5">{product.type}</p>
              
              <div className="mt-auto pt-5 flex items-center justify-between">
                <p className="font-serif text-[#c9a96e] text-lg tabular-nums">
                  ₹ {product.price.toLocaleString("en-IN")}
                </p>
                {/* MNC Fix: Minimum 44px touch target for accessibility */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-11 h-11 rounded-full border border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0705] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/50"
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}