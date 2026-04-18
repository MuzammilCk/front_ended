import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminCreateListing } from "../../api/admin";
import { getSignedUploadUrl, confirmUpload } from "../../api/media";
import LuxuryImage from "../ui/LuxuryImage";
import { useAdminData } from "../../context/AdminContext";

const PERF_TYPES = ["Eau de Parfum", "Extrait de Parfum", "Eau de Toilette", "Eau de Cologne"];
const FAMILIES = ["Woody", "Floral", "Fresh", "Oriental"];

const EMPTY_FORM = {
  name: "", sku: "", skuManuallyEdited: false, type: "Eau de Parfum", family: "Woody",
  price: "", quantity: "50", ml: "50", notes: "", badge: "", intensity: "70",
  categoryId: "", condition: "new", description: ""
};

export default function AddProductTab() {
  const navigate = useNavigate();
  const { setProducts, categories, addToast } = useAdminData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<{ storage_key: string; cdn_url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f: any) => ({ ...f, [k]: v }));

  const generateSku = (name: string, ml: string, type: string): string => {
    const typeAbbr: Record<string, string> = {
      'Eau de Parfum': 'edp',
      'Extrait de Parfum': 'extrait',
      'Eau de Toilette': 'edt',
      'Eau de Cologne': 'edc',
    };
    return [
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      `${ml}ml`,
      typeAbbr[type] ?? 'perfume'
    ].filter(Boolean).join('-');
  };

  useEffect(() => {
    if (!form.skuManuallyEdited && form.name) {
      set("sku", generateSku(form.name, form.ml, form.type));
    }
  }, [form.name, form.ml, form.type]);

  useEffect(() => {
    if (form.badge) return;
    const n = form.name.toLowerCase();
    if (n.includes('bestsell') || n.includes('best sell')) set("badge", 'Bestseller');
    else if (n.includes('new') || n.includes('launch')) set("badge", 'New');
    else if (n.includes('limited') || n.includes('ltd')) set("badge", 'Limited');
  }, [form.name]);

  const handleMultipleImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 5 - uploadedAssets.length);
    if (fileArray.length === 0) return;
    
    setUploading(true);
    setUploadError('');
    
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const { upload_url, storage_key } = await getSignedUploadUrl(file.name, file.type);
        await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        return confirmUpload(storage_key, { alt_text: file.name });
      });
      
      const newAssets = await Promise.all(uploadPromises);
      setUploadedAssets(prev => [...prev, ...newAssets]);
    } catch {
      setUploadError('One or more uploads failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Fragrance name is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return 'Valid price is required.';
    if (!form.sku.trim()) return 'SKU is required.';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) return 'Valid quantity is required.';
    return null;
  };

  const handleAdd = async (createAnotherVariant = false) => {
    const err = validate();
    if (err) { setFormError(err); return; }
    
    setFormError("");
    setSubmitting(true);
    
    try {
      await adminCreateListing({
        title: form.name,
        sku: form.sku,
        description: form.description || form.notes,
        price: Number(form.price),
        quantity: Number(form.quantity),
        intensity: Number(form.intensity),
        category_id: form.categoryId || undefined,
        condition: form.condition,
        status: 'active',
        media_keys: uploadedAssets.map(a => a.storage_key),
      });

      setProducts((p) => [
        {
          id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
          name: form.name,
          type: form.type,
          family: form.family,
          price: Number(form.price),
          stock: Number(form.quantity),
          active: true,
        },
        ...p,
      ]);
      
      if (createAnotherVariant) {
        setForm(prev => ({
          ...prev,
          sku: '',
          skuManuallyEdited: false,
          price: '',
          quantity: '50',
          ml: '50',
        }));
        setFormError('');
        addToast('Product created! Form ready for next variant — update size and price.', 'success');
      } else {
        addToast('Fragrance added to catalogue', 'success');
        navigate('/admin/products');
      }
    } catch {
      setFormError('Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setUploadedAssets([]);
    setFormError("");
  };

  const inputCls = "w-full bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs font-light px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors duration-300";
  const labelCls = "admin-label";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border border-[#c9a96e]/10 bg-gradient-to-br from-[#0d0a07] to-[#100c08] p-8">
        <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-1">New Fragrance</p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted/25 mb-8">Fill in the details below</p>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Fragrance Name <span className="text-rose-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Oud Mystique" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            
            <div>
              <label className={labelCls}>SKU (auto-generated · editable) <span className="text-rose-400">*</span></label>
              <input
                className={inputCls}
                value={form.sku}
                onChange={e => {
                  set('sku', e.target.value);
                  set('skuManuallyEdited', true);
                }}
                placeholder="e.g. oud-mystique-50ml-edp"
              />
              <button
                type="button"
                onClick={() => {
                  set('skuManuallyEdited', false);
                  set('sku', generateSku(form.name, form.ml, form.type));
                }}
                className="text-[9px] tracking-widest uppercase text-[#c9a96e]/40 hover:text-[#c9a96e] mt-1 transition"
              >
                ↺ Regenerate
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price (INR) <span className="text-rose-400">*</span></label>
                <input type="number" className={inputCls} placeholder="e.g. 450" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Initial Stock <span className="text-rose-400">*</span></label>
                <input type="number" min="0" placeholder="e.g. 50" value={form.quantity} onChange={e => set('quantity', e.target.value)} className={inputCls} />
              </div>
            </div>

             <div className="col-span-2">
              <label className={labelCls}>Category</label>
              <select value={form.categoryId || ""} onChange={e => set('categoryId', e.target.value)} className={inputCls}>
                <option value="" className="bg-[#130e08]">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id} className="bg-[#130e08]">{c.name}</option>)}
              </select>
            </div>

             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Type <span className="text-rose-400">*</span></label>
                <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  {PERF_TYPES.map((t) => <option key={t} className="bg-[#130e08]">{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Scent Family <span className="text-rose-400">*</span></label>
                <select className={inputCls} value={form.family} onChange={(e) => set("family", e.target.value)}>
                  {FAMILIES.map((f) => <option key={f} className="bg-[#130e08]">{f}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Volume (ml)</label>
                <select className={inputCls} value={form.ml} onChange={(e) => set("ml", e.target.value)}>
                  {["30", "50", "75", "100"].map((v) => <option key={v} className="bg-[#130e08]">{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls}>
                  {['new', 'like_new', 'good', 'fair'].map(c => <option key={c} value={c} className="bg-[#130e08]">{c}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className={labelCls}>Badge</label>
                <select className={inputCls} value={form.badge} onChange={(e) => set("badge", e.target.value)}>
                  <option value="" className="bg-[#130e08]">None</option>
                  {["New", "Bestseller", "Limited", "Exclusive"].map((b) => <option key={b} className="bg-[#130e08]">{b}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className={labelCls}>Intensity — {form.intensity}%</label>
                <input type="range" min="10" max="100" className="w-full mt-2 accent-[#c9a96e]" value={form.intensity} onChange={(e) => set("intensity", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className={labelCls}>Scent Notes</label>
              <input className={inputCls} placeholder="e.g. Oud · Amber · Sandalwood" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>

            <div className="flex-1">
              <label className={labelCls}>Full Description</label>
              <textarea
                className={`${inputCls} min-h-[120px] h-[calc(100%-24px)] resize-none`}
                placeholder="Detailed product description for the product page..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Product Images</label>
              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                {uploadedAssets.map((a, i) => (
                  <div key={i} className="relative w-16 h-20 border border-[#c9a96e]/15 overflow-hidden group">
                    <LuxuryImage src={a.cdn_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedAssets(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 w-5 h-5 bg-rose-500/80 text-white text-[10px] flex items-center justify-center hover:bg-rose-500"
                    >✕</button>
                  </div>
                ))}
              </div>
              
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#c9a96e]/60'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#c9a96e]/60'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-[#c9a96e]/60');
                  void handleMultipleImageUpload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed ${uploadedAssets.length >= 5 ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-[#c9a96e]/25 hover:border-[#c9a96e]/50 cursor-pointer'} p-6 text-center transition-colors`}
                onClick={() => {
                  if (uploadedAssets.length < 5) document.getElementById('multi-image-input')?.click();
                }}
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
                    <span className="font-sans text-xs text-muted/40">Uploading {uploadedAssets.length}/5...</span>
                  </div>
                ) : (
                  <div>
                    <p className="font-sans text-xs text-white/40">Drop up to 5 images here, or click to select</p>
                    <p className="font-sans text-[10px] text-muted/25 mt-1">PNG, JPG, WEBP up to 10MB each</p>
                  </div>
                )}
                <input
                  id="multi-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && void handleMultipleImageUpload(e.target.files)}
                  disabled={uploading || uploadedAssets.length >= 5}
                />
              </div>

              {uploadError && <p className="text-rose-400 text-[10px] tracking-[0.1em] mt-2">⚠ {uploadError}</p>}
            </div>
          </div>
        </div>

        {formError && <p className="text-rose-400 text-[10px] tracking-[0.1em] mt-4">⚠ {formError}</p>}

        <div className="flex gap-3 mt-8 flex-wrap">
          <button
            onClick={() => void handleAdd(false)}
            disabled={submitting}
            className="bg-[#c9a96e] text-[#080604] font-sans text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-[#e8c87a] transition-colors disabled:opacity-50 font-medium"
          >
            {submitting ? 'Creating…' : 'Save Product'}
          </button>
          <button
            onClick={() => void handleAdd(true)}
            disabled={submitting}
            className="border border-[#c9a96e]/40 text-[#c9a96e] font-sans text-xs tracking-[0.15em] uppercase px-5 py-3 hover:bg-[#c9a96e]/8 hover:border-[#c9a96e]/70 transition-all disabled:opacity-50"
            title="Save this product and prepare form for a new size variant (keeps images and description)"
          >
            Save & Add New Size →
          </button>
          <button
            onClick={resetForm}
            className="border border-white/10 text-white/40 font-sans text-xs px-4 py-3 hover:text-white/60 transition-colors ml-auto uppercase tracking-widest"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
