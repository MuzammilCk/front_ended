// src/components/order-components/PriceBreakdown.tsx
// Receipt-style price summary for an order.

interface PriceBreakdownProps {
  subtotal: string;
  shippingFee: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  currency: string;
}

function Row({
  label,
  value,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex justify-between items-baseline ${highlight ? 'pt-3 mt-3 border-t border-[#c9a96e]/15' : ''}`}>
      <span className={`text-xs uppercase tracking-widest ${highlight ? 'text-[#c9a96e]' : 'text-[#e8dcc8]/50'}`}>
        {label}
      </span>
      <span className={`text-sm font-display ${highlight ? 'text-[#c9a96e] text-lg' : negative ? 'text-emerald-400' : 'text-[#e8dcc8]'}`}>
        {negative ? '−' : ''}{value}
      </span>
    </div>
  );
}

export default function PriceBreakdown({
  subtotal,
  shippingFee,
  taxAmount,
  discountAmount,
  totalAmount,
  currency,
}: PriceBreakdownProps) {
  const fmt = (v: string) =>
    `${currency} ${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const discount = parseFloat(discountAmount);
  const shipping = parseFloat(shippingFee);
  const tax = parseFloat(taxAmount);

  return (
    <div className="bg-[#0d0a07]/40 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#c9a96e]/8">
        <h3 className="text-[10px] uppercase tracking-widest text-[#c9a96e]/60">
          Price Summary
        </h3>
      </div>
      <div className="p-5 space-y-2.5">
        <Row label="Subtotal" value={fmt(subtotal)} />
        {shipping > 0 && <Row label="Shipping" value={fmt(shippingFee)} />}
        {shipping === 0 && <Row label="Shipping" value="Free" />}
        {tax > 0 && <Row label="Tax" value={fmt(taxAmount)} />}
        {discount > 0 && (
          <Row label="Discount" value={fmt(discountAmount)} negative />
        )}
        <Row label="Total" value={fmt(totalAmount)} highlight />
      </div>
    </div>
  );
}
