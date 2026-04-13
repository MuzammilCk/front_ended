import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";
import gsap from "gsap";

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    type: string;
    price: number;
    quantity: number;
    image: string;
    listing_id?: string;
  };
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}

export default function CartItemCard({ item, updateQuantity, removeItem }: CartItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qtyRef = useRef<HTMLSpanElement>(null);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const handleMinus = () => {
    if (item.quantity <= 1) {
      handleRemove();
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = () => {
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
        <p className="text-xs text-white/50">{item.type}</p>

        <button
          onClick={handleRemove}
          className="flex items-center gap-1 mt-3 text-xs text-red-400 hover:text-red-300 w-max transition"
          disabled={isRemoving}
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
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
            disabled={isRemoving}
            className="text-white/60 hover:text-white transition p-1"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}