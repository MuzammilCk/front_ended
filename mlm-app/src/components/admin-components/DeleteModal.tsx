import React from "react";
import type { AdminProductType } from "../../api/types";

interface DeleteModalProps {
  deleteId: string;
  setDeleteId: (id: string | null) => void;
  setProducts: React.Dispatch<React.SetStateAction<AdminProductType[]>>;
}

export default function DeleteModal({
  deleteId,
  setDeleteId,
  setProducts,
}: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#080604]/80 backdrop-blur-md flex items-center justify-center"
      onClick={() => setDeleteId(null)}
    >
      <div
        className="border border-rose-500/20 bg-[#0d0a07] p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-2">
          Remove Fragrance?
        </p>
        <p className="text-[11px] text-muted/40 tracking-wide mb-6">
          This will permanently remove the product from the catalogue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setProducts((p) => p.filter((x) => x.id !== deleteId));
              setDeleteId(null);
            }}
            className="bg-rose-500/80 text-white text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-rose-500 transition-colors duration-300"
          >
            Remove
          </button>
          <button
            onClick={() => setDeleteId(null)}
            className="border border-[#c9a96e]/25 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-[#c9a96e]/8 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
