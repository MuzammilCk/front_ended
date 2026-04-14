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
  const [isRemoving, setIsRemoving] = useState(false);
  const { addItem } = useWishlist();

  // Animate the quantity flip when it changes
  useEffect(() => {
    if (qtyRef.current && !isRemoving) {
      gsap.fromTo(
        qtyRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [item.quantity, isRemoving]);

  const handleRemove = () => {
    if (isRemoving) return;
    setIsRemoving(true);

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: -50,
        opacity: 0,
        height: 0,
        padding: 0,
        margin: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          removeItem(item.id);
        }
      });
    } else {
      removeItem(item.id);
    }
  };

  const moveToWishlist = () => {
    if (isRemoving) return;
    setIsRemoving(true);

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: -50,
        opacity: 0,
        height: 0,
        padding: 0,
        margin: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          addItem({
            id: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            image: item.image,
            notes: item.notes || "",
            inStock: item.inStock ?? true,
          });
          removeItem(item.id);
        },
      });
    } else {
      addItem({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        image: item.image,
        notes: item.notes || "",
        inStock: item.inStock ?? true,
      });
      removeItem(item.id);
    }
  };

  const isOutOfStock = item.inStock === false;
  const maxQty = Math.min(item.available_qty ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM);
  const isAtMax = item.quantity >= maxQty;

  const handleMinus = () => {
    if (item.quantity <= 1) {
      handleRemove();
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = () => {
    if (item.quantity >= maxQty) return;
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div ref={cardRef} className="p-4 border-b border-[#c9a96e]/10 flex gap-4 overflow-hidden">
      <Link to={`/product/${item.listing_id ?? ''}`} className="shrink-0 block">
        <LuxuryImage
          src={item.image}
          alt={item.name}
          className="object-cover w-20 h-20 rounded-lg hover:opacity-80 transition"
        />
      </Link>

      <div className="flex-1 flex flex-col justify-center">
        <Link
          to={`/product/${item.listing_id ?? ''}`}
          className="text-[#e8dcc8] hover:text-[#c9a96e] transition line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>
        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">
          {item.type}
        </p>
        
        {item.notes && (
          <p className="text-[11px] text-white/40 italic line-clamp-1 mt-0.5">
            {item.notes}
          </p>
        )}

        {isOutOfStock ? (
          <p className="text-xs text-rose-500 mt-1">Out of Stock</p>
        ) : item.available_qty !== undefined && item.available_qty < 10 ? (
          <p className="text-xs text-amber-500 mt-1">Only {item.available_qty} left in stock — order soon.</p>
        ) : item.inStock === true ? (
          <p className="text-xs text-emerald-500 mt-1">In Stock</p>
        ) : null}

        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={moveToWishlist}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white w-max transition"
            disabled={isRemoving}
          >
            <Heart className="w-3.5 h-3.5" />
            Move to Wishlist
          </button>

          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-xs text-red-500/80 hover:text-red-400 w-max transition"
            disabled={isRemoving}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 justify-center">
        <p className="text-[#c9a96e] font-serif tracking-widest whitespace-nowrap">
          INR {(item.price * item.quantity).toLocaleString('en-IN')}
        </p>

        <div className="flex items-center justify-between gap-3 bg-[#110d0a] border border-[#c9a96e]/20 rounded-full px-2 py-1 min-w-[90px]">
          <button
            onClick={handleMinus}
            disabled={isRemoving}
            className="text-white/60 hover:text-white transition p-1"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span ref={qtyRef} className="text-sm font-medium w-4 text-center select-none text-[#e8dcc8] inline-block">
            {item.quantity}
          </span>

          <button
            onClick={handlePlus}
            disabled={isRemoving || isOutOfStock || isAtMax}
            className="text-white/60 hover:text-white transition p-1 disabled:opacity-50"
            title={isAtMax ? `Max ${maxQty} allowed` : undefined}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}