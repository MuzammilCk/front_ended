import { Gift, Package, Truck } from "lucide-react";

export default function WishlistBenefits() {
  return (
    <div className="border border-[#c9a96e]/10 rounded-lg p-6">
      <h3 className="mb-4">Exclusive Benefits</h3>

      <div className="space-y-3 text-xs">
        <div className="flex gap-3">
          <Gift className="w-4 h-4 text-[#c9a96e]" />
          Price Drop Alerts
        </div>
        <div className="flex gap-3">
          <Package className="w-4 h-4 text-[#c9a96e]" />
          Back in Stock
        </div>
        <div className="flex gap-3">
          <Truck className="w-4 h-4 text-[#c9a96e]" />
          Free Shipping
        </div>
      </div>
    </div>
  );
}