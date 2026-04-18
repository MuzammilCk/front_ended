import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, Heart } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";
import gsap from "gsap";
import { useWishlist } from "../../context/WishlistContext";
import { MAX_QTY_PER_ITEM } from "../../constants/cart.constants";

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    type: string;
    price: number;
    quantity: number;
    image: string;
    listing_id?: string;
    notes?: string;
    available_qty?: number;
    inStock?: boolean;
  };
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}

export default function CartItemCard({ item, updateQuantity, removeItem }: CartItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qtyRef = useRef<HTMLSpanElement>(null);
  const[isRemoving, setIsRemoving] = useState(false);
  const { addItem } = useWishlist();

  useEffect(() => {
    if (qtyRef.current && !isRemoving) {
      gsap.fromTo(
        qtyRef.current,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [item.quantity, isRemoving]);

  const triggerRemoveAnim = (callback: () => void) => {
    if (isRemoving) return;
    setIsRemoving(true);
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: -30, opacity: 0, height: 0, padding: 0, margin: 0, borderBottomWidth: 0,
        duration: 0.4, ease: "power2.inOut",
        onComplete: callback
      });
    } else {
      callback();
    }
  };

  const handleRemove = () => triggerRemoveAnim(() => removeItem(item.id));
  
  const moveToWishlist = () => {
    triggerRemoveAnim(() => {
      addItem({
        id: item.id, name: item.name, type: item.type, price: item.price,
        image: item.image, notes: item.notes || "", inStock: item.inStock ?? true,
      });
      removeItem(item.id);
    });
  };

  const isOutOfStock = item.inStock === false;
  const maxQty = Math.min(item.available_qty ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM);
  const isAtMax = item.quantity >= maxQty;

  const handleMinus = () => item.quantity <= 1 ? handleRemove() : updateQuantity(item.id, item.quantity - 1);
  const handlePlus = () => { if (!isAtMax) updateQuantity(item.id, item.quantity + 1); };

  return (
    <div ref={cardRef} className="p-4 sm:p-6 border-b border-sand/10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 overflow-hidden bg-void hover:bg-sand/[0.02] transition-colors">
      <div className="flex w-full sm:w-auto gap-4">
        <Link to={`/product/${item.listing_id ?? ''}`} className="shrink-0 block">
          <LuxuryImage
            src={item.image}
            alt={item.name}
            className="object-cover w-24 h-24 sm:w-28 sm:h-28 rounded-lg hover:opacity-80 transition"
          />
        </Link>

        <div className="flex-1 flex flex-col justify-center sm:hidden">
           {/* Mobile Top Info */}
           <Link to={`/product/${item.listing_id ?? ''}`} className="text-text-primary text-display text-lg leading-tight mb-1">{item.name}</Link>
           <p className="text-label text-white/50">{item.type}</p>
           <p className="text-sand font-serif text-lg mt-2 tabular-nums">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col sm:flex-row justify-between gap-4">
        <div className="hidden sm:flex flex-col justify-center max-w-sm">
          {/* Desktop Info */}
          <Link to={`/product/${item.listing_id ?? ''}`} className="text-text-primary text-display text-xl hover:text-sand transition leading-snug">{item.name}</Link>
          <p className="text-label text-white/50 mt-1.5">{item.type}</p>
          {item.notes && <p className="text-xs text-white/40 italic line-clamp-1 mt-1.5">{item.notes}</p>}
          
          {isOutOfStock ? (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Out of Stock</p>
          ) : item.available_qty !== undefined && item.available_qty < 10 ? (
            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Only {item.available_qty} left</p>
          ) : item.inStock === true ? (
            <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" /> In Stock</p>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto border-t sm:border-t-0 border-sand/10 pt-4 sm:pt-0">
          <p className="hidden sm:block text-sand font-serif text-xl tracking-wide tabular-nums">
            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
          </p>

          {/* MNC Fix: Expanded touch targets (min 44px) for quantity controls */}
          <div className="flex items-center justify-between bg-[#110d0a] border border-[#c9a96e]/20 rounded-full p-1 w-[140px]">
            <button onClick={handleMinus} disabled={isRemoving} className="text-white/60 hover:text-white hover:bg-sand/10 transition rounded-full w-11 h-11 flex items-center justify-center">
              <Minus className="w-4 h-4" />
            </button>
            <span ref={qtyRef} className="text-sm font-medium w-6 text-center select-none text-text-primary tabular-nums">
              {item.quantity}
            </span>
            <button onClick={handlePlus} disabled={isRemoving || isOutOfStock || isAtMax} className="text-white/60 hover:text-white hover:bg-sand/10 transition rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-30">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center gap-6 sm:mt-4 sm:w-auto">
        <button onClick={moveToWishlist} disabled={isRemoving} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition group py-2">
          <Heart className="w-4 h-4 group-hover:fill-white/20 transition-all" />
          <span className="hidden sm:inline text-label">Wishlist</span>
        </button>
        <button onClick={handleRemove} disabled={isRemoving} className="flex items-center gap-2 text-xs text-rose-500/60 hover:text-rose-400 transition group py-2">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-label">Remove</span>
        </button>
      </div>
    </div>
  );
}
