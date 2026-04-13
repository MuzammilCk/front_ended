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
    <div className="mt-12">
      <h2 className="font-display text-2xl text-[#e8dcc8]">You May Also Like</h2>
      <div className="h-[1px] w-12 bg-[#c9a96e]/40 mt-3 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-[#0d0a07] border border-[#c9a96e]/10 hover:border-[#c9a96e]/30 transition flex flex-col"
          >
            <Link to={`/product/${product.listing_id || product.id}`} className="block aspect-[3/4] overflow-hidden relative">
              {product.image ? (
                <LuxuryImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#0d0a07] to-[#c9a96e]/20 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-[#c9a96e]/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M10 4v2m4-2v2m-6 4h8m-9 0V8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2m-9 0c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2z"
                    />
                  </svg>
                </div>
              )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
              <Link to={`/product/${product.listing_id || product.id}`}>
                <h3 className="font-display text-[#e8dcc8] text-base line-clamp-1">{product.name}</h3>
              </Link>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{product.type}</p>
              <p className="font-serif text-[#c9a96e] mt-2">
                ₹ {product.price.toLocaleString("en-IN")}
              </p>

              <div className="mt-auto pt-3 flex items-center justify-between">
                <Link
                  to={`/product/${product.listing_id || product.id}`}
                  className="text-[10px] uppercase tracking-widest text-white/40 hover:text-[#c9a96e] transition"
                >
                  View
                </Link>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="size-8 rounded-full border border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0705] transition"
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}