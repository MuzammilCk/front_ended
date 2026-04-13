import { Link } from "react-router-dom";
import { X } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";
import type { WishlistItem } from "../../context/WishlistContext";

export interface WishlistItemCardProps {
  item: WishlistItem;
  onMoveToCart: (item: WishlistItem) => void;
  onRemove: (id: string) => void;
  isMoving: boolean;
}

export default function WishlistItemCard({
  item,
  onMoveToCart,
  onRemove,
  isMoving,
}: WishlistItemCardProps) {
  return (
    <div className="flex flex-col relative group border border-[#c9a96e]/20 bg-[#0a0705] hover:border-[#c9a96e]/50 transition-all duration-300">
      
      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onRemove(item.id);
        }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur bg-black/40 border border-white/10 text-white/80 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
        aria-label={`Remove ${item.name} from wishlist`}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Image Area */}
      <Link to={`/product/${item.id}`} className="block relative aspect-[4/5] bg-[#130e08] overflow-hidden">
        <LuxuryImage
          src={item.image}
          alt={item.name}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
        />
        {!item.inStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
            <span className="px-4 py-2 border border-white/20 bg-black/60 text-white text-xs uppercase tracking-widest backdrop-blur-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Details Area */}
      <div className="flex flex-col flex-1 p-4 text-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] mb-1 truncate">
          {item.type}
        </span>
        <Link 
          to={`/product/${item.id}`} 
          className="text-base font-display text-[#e8dcc8] hover:text-white transition-colors truncate"
        >
          {item.name}
        </Link>
        <span className="font-sans text-sm font-light text-white/80 mt-1">
          INR {item.price.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Move to Bag Button */}
      <button
        type="button"
        disabled={!item.inStock || isMoving}
        onClick={() => onMoveToCart(item)}
        className={`w-full py-3.5 text-[11px] font-sans font-medium uppercase tracking-[0.2em] border-t border-[#c9a96e]/20 transition-colors ${
          !item.inStock 
            ? "text-white/30 bg-[#111] cursor-not-allowed" 
            : isMoving 
              ? "bg-[#c9a96e] text-black" 
              : "text-[#c9a96e] hover:bg-[#c9a96e] hover:text-black"
        }`}
      >
        {isMoving ? "Moving..." : "Move to Bag"}
      </button>
      
    </div>
  );
}