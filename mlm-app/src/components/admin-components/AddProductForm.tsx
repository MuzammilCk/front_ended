export default function AddProductForm({
  form,
  setForm,
  handleAddProduct,
  error
}) {
  return (
    <div>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      {error && <p>{error}</p>}

      <button onClick={handleAddProduct}>
        Add Product
      </button>
    </div>
  );
}