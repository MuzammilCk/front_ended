// src/components/order-components/OrderItemCard.tsx
// Single order item display card with image, title, qty, and pricing.

import { Link } from 'react-router-dom';
import LuxuryImage from '../ui/LuxuryImage';
import type { OrderItem } from '../../api/types';

interface OrderItemCardProps {
  item: OrderItem;
  imageUrl?: string;
}

export default function OrderItemCard({ item, imageUrl }: OrderItemCardProps) {
  const unitPrice = parseFloat(item.unit_price);
  const lineTotal = parseFloat(item.line_total);

  return (
    <div className="flex gap-4 p-4 bg-[#0d0a07]/40 rounded-xl border border-[#c9a96e]/8 hover:border-[#c9a96e]/15 transition-colors">
      {/* Thumbnail */}
      <Link 
        to={`/product/${item.listing_id}`} 
        className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-[#0d0a07] overflow-hidden flex-shrink-0 block hover:opacity-80 transition-opacity"
      >
        {imageUrl ? (
          <LuxuryImage
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[8px] uppercase tracking-widest text-[#c9a96e]/20">
              No Image
            </span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <Link 
             to={`/product/${item.listing_id}`}
             className="block hover:text-[#c9a96e] transition-colors"
          >
             <h4 className="font-display text-base text-[#e8dcc8] leading-tight truncate hover:text-[#c9a96e] transition-colors">
               {item.title}
             </h4>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 mt-1">
            SKU: {item.sku}
          </p>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#e8dcc8]/50">
              {item.qty} × {item.currency} {unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-sm font-display text-[#c9a96e]">
            {item.currency} {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
