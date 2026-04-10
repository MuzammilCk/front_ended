import { Trash2, Plus, Minus } from "lucide-react";

export default function CartItemCard({ item, updateQuantity, removeItem }) {
  return (
    <div className="p-4 border-b border-[#c9a96e]/10 flex gap-4">

      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        decoding="async"
        className="object-cover w-20 h-20 rounded-lg"
      />

      <div className="flex-1">
        <h3>{item.name}</h3>
        <p className="text-xs text-[#c9b99a]/60">{item.type}</p>

        <button
          onClick={() => removeItem(item.id)}
          className="flex items-center gap-1 mt-2 text-xs text-red-400"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
          <Minus className="w-3 h-3" />
        </button>
        <span>{item.quantity}</span>
        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[#c9a96e]">INR {item.price * item.quantity}</p>
    </div>
  );
}