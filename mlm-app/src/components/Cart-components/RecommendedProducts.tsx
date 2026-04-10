export default function RecommendedProducts({ products }) {
  return (
    <div className="mt-10">
      <h2 className="mb-4">You Might Also Like</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {products.map(p => (
          <div key={p.id} className="p-4 border rounded-lg">
            <h3>{p.name}</h3>
            <p className="text-xs">{p.type}</p>
            <p className="text-[#c9a96e] mt-2">INR {p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}