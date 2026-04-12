import React, { useState } from "react";
import type { AdminProductType, AdminTabType } from "../../api/types";
import { adminCreateListing } from "../../api/admin";
import { getSignedUploadUrl, confirmUpload } from "../../api/media";
import LuxuryImage from "../ui/LuxuryImage";

const PERF_TYPES = [
  "Eau de Parfum",
  "Extrait de Parfum",
  "Eau de Toilette",
  "Eau de Cologne",
];
const FAMILIES = ["Woody", "Floral", "Fresh", "Oriental"];

const EMPTY_FORM = {
  name: "",
  type: "Eau de Parfum",
  family: "Woody",
  price: "",
  ml: "50",
  notes: "",
  badge: "",
  intensity: "70",
};

interface AddProductTabProps {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  formError: string;
  setFormError: (error: string) => void;
  products: AdminProductType[];
  setProducts: React.Dispatch<React.SetStateAction<AdminProductType[]>>;
  setAddSuccess: (success: boolean) => void;
  setTab: (tab: AdminTabType) => void;
}

export default function AddProductTab({
  form,
  setForm,
  formError,
  setFormError,
  setProducts,
  setAddSuccess,
  setTab,
}: AddProductTabProps) {
  const [mediaKeys, setMediaKeys] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      // Step 1: get signed URL from backend
      const { upload_url, storage_key } = await getSignedUploadUrl(file.name, file.type);

      // Step 2: PUT file directly to storage (NOT through your backend)
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // Step 3: confirm with backend
      const asset = await confirmUpload(storage_key, { alt_text: file.name });

      // Step 4: store storage_key in form state so it connects successfully to the Listing
      setMediaKeys(prev => [...prev, asset.storage_key]);
      setPreviewUrl(asset.cdn_url);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleImageUpload(file);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.price) {
      setFormError("Name and price are required.");
      return;
    }
    setFormError("");
    setSubmitting(true);

    try {
      await adminCreateListing({
        title: form.name,
        sku: form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.notes,
        price: Number(form.price),
        quantity: 50,
        status: 'active',
        media_keys: mediaKeys,
      });

      setProducts((p) => [
        {
          id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
          name: form.name,
          type: form.type,
          family: form.family,
          price: Number(form.price),
          stock: 50,
          active: true,
        },
        ...p,
      ]);
      setForm(EMPTY_FORM);
      setMediaKeys([]);
      setPreviewUrl(null);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
      setTab("products");
    } catch {
      setFormError("Failed to create product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs font-light px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors duration-300";
  const labelCls =
    "block text-[10px] tracking-[0.2em] uppercase text-muted/35 mb-1.5";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-8">
        <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-1">
          New Fragrance
        </p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted/25 mb-8">
          Fill in the details below
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Fragrance Name *</label>
            <input
              className={inputCls}
              placeholder="e.g. Oud Mystique"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Type *</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {PERF_TYPES.map((t) => (
                <option key={t} className="bg-[#130e08]">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Scent Family *</label>
            <select
              className={inputCls}
              value={form.family}
              onChange={(e) => set("family", e.target.value)}
            >
              {FAMILIES.map((f) => (
                <option key={f} className="bg-[#130e08]">
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Price (INR) *</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 450"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Volume (ml)</label>
            <select
              className={inputCls}
              value={form.ml}
              onChange={(e) => set("ml", e.target.value)}
            >
              {["30", "50", "75", "100"].map((v) => (
                <option key={v} className="bg-[#130e08]">
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Scent Notes</label>
            <input
              className={inputCls}
              placeholder="e.g. Oud · Amber · Sandalwood"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Badge</label>
            <select
              className={inputCls}
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
            >
              <option value="" className="bg-[#130e08]">
                None
              </option>
              {["New", "Bestseller", "Limited", "Exclusive"].map((b) => (
                <option key={b} className="bg-[#130e08]">
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Intensity — {form.intensity}%</label>
            <input
              type="range"
              min="10"
              max="100"
              className="w-full mt-2 accent-[#c9a96e]"
              value={form.intensity}
              onChange={(e) => set("intensity", e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="col-span-2">
            <label className={labelCls}>Product Image</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer border border-dashed border-[#c9a96e]/25 px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-[#c9a96e]/60 hover:border-[#c9a96e]/50 hover:text-[#c9a96e] transition-colors">
                {uploading ? "Uploading…" : "Choose file"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              {previewUrl && (
                <LuxuryImage
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-16 object-cover border border-[#c9a96e]/15"
                />
              )}
              {mediaKeys.length > 0 && (
                <span className="text-[10px] text-emerald-400/60">
                  {mediaKeys.length} image(s) attached
                </span>
              )}
            </div>
            {uploadError && (
              <p className="text-rose-400 text-[10px] tracking-[0.1em] mt-2">
                ⚠ {uploadError}
              </p>
            )}
          </div>
        </div>

        {formError && (
          <p className="text-rose-400 text-[10px] tracking-[0.1em] mt-4">
            ⚠ {formError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => void handleAdd()}
            disabled={submitting}
            className="bg-[#c9a96e] text-[#080604] text-[10px] tracking-[0.25em] uppercase px-6 py-3 hover:bg-[#e8c87a] transition-colors duration-300 font-light disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Add to Catalogue"}
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setMediaKeys([]); setPreviewUrl(null); }}
            className="border border-[#c9a96e]/25 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase px-5 py-3 hover:bg-[#c9a96e]/8 hover:border-[#c9a96e]/50 transition-all duration-300 font-light"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-6">
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted/20 mb-4">
          Live Preview
        </p>
        <div className="flex items-center gap-5">
          <div className="w-16 h-24 border border-[#c9a96e]/15 bg-gradient-to-br from-[#1a0f0a] to-[#2d1810] flex items-center justify-center shrink-0 overflow-hidden">
            {previewUrl ? (
              <LuxuryImage src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-6 h-14 border border-[#c9a96e]/25 bg-gradient-to-b from-[#c9a96e]/10 to-transparent" />
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted/25">
              {form.type} · {form.ml}ml
            </p>
            <p className="font-serif text-2xl font-light text-[#e8dcc8]">
              {form.name || "Fragrance Name"}
            </p>
            <p className="text-[11px] text-muted/30">
              {form.notes || "Scent notes will appear here"}
            </p>
            <p className="font-serif text-lg font-light text-[#c9a96e] mt-1">
              {form.price ? `INR ${form.price}` : "INR —"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
