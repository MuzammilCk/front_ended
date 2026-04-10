import { Link } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";

export default function WishlistItemCard({
  item,
  addToCart,
  removeFromWishlist,
  addedToCart,
}) {
  return (
    <div className="group relative overflow-hidden border rounded-lg border-[#c9a96e]/10 bg-gradient-to-br from-[#c9a96e]/5 to-transparent hover:border-[#c9a96e]/30 hover:scale-[1.01] transition-all">

      <div className="flex flex-col gap-4 p-4 md:flex-row">

        {/* IMAGE */}
        <Link to={`/product/${item.id}`} className="relative">
          <div className="w-24 h-24 md:w-28 md:h-28 overflow-hidden rounded-lg bg-[#c9a96e]/10">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="object-cover w-full h-full transition group-hover:scale-110"
            />
          </div>
        </Link>

        {/* INFO */}
        <div className="flex-1">
          <h3 className="text-lg">{item.name}</h3>
          <p className="text-xs text-[#c9b99a]/60">{item.type}</p>
          <p className="text-xs text-[#c9b99a]/40">{item.notes}</p>

          <div className="flex gap-3 mt-3">
            <span className="text-[#c9a96e]">INR {item.price}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => addToCart(item.id)}
            className="bg-[#c9a96e] text-[#0a0705] px-4 py-2 rounded-lg"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            onClick={() => removeFromWishlist(item.id)}
            className="text-red-400"
          >
            <Trash2 />
          </button>
        </div>

      </div>
    </div>
  );
}