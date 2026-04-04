export default function ProductsTable({ products, toggleActive, confirmDelete }) {
  return (
    <div>
      {products.map(p => (
        <div key={p.id}>
          <span>{p.name}</span>

          <button onClick={() => toggleActive(p.id)}>
            {p.active ? "ON" : "OFF"}
          </button>

          <button onClick={() => confirmDelete(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}