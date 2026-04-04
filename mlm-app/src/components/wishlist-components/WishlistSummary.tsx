export default function WishlistSummary({ items }) {
  return (
    <div className="border border-[#c9a96e]/10 rounded-lg p-6">
      <h2>Wishlist Summary</h2>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total Items</span>
          <span>{items.length}</span>
        </div>

        <div className="flex justify-between">
          <span>Total Value</span>
          <span className="text-[#c9a96e]">
            AED {items.reduce((s, i) => s + i.price, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}