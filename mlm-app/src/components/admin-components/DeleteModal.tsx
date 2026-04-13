import { adminUpdateListing } from '../../api/admin';
import type { AdminProductType } from '../../api/types';
import { useState } from 'react';

interface DeleteModalProps {
  deleteId: string | null;        // null = closed
  deleteName?: string;            // product name to show in confirmation text
  setDeleteId: (id: string | null) => void;
  setProducts: React.Dispatch<React.SetStateAction<AdminProductType[]>>;
}

export default function DeleteModal({ deleteId, deleteName, setDeleteId, setProducts }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!deleteId) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await adminUpdateListing(deleteId, { status: 'removed' });
      setProducts(p => p.filter(x => x.id !== deleteId));
      setDeleteId(null);
    } catch {
      setError('Failed to delete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080604]/80 backdrop-blur-md flex items-center justify-center"
      onClick={() => !loading && setDeleteId(null)}
    >
      <div
        className="border border-rose-500/20 bg-[#0d0a07] p-8 max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-2">Remove Fragrance?</p>
        {deleteName && (
          <p className="text-[11px] text-[#c9a96e]/60 mb-2">"{deleteName}"</p>
        )}
        <p className="text-[11px] text-muted/40 tracking-wide mb-6">
          This will permanently remove the product from the catalogue.
        </p>
        {error && <p className="text-rose-400 text-[10px] mb-4">⚠ {error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-rose-500/80 text-white text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
          <button
            onClick={() => setDeleteId(null)}
            disabled={loading}
            className="border border-[#c9a96e]/25 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-[#c9a96e]/8 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
