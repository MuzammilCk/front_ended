import { useState, useEffect } from 'react';
import { adminUpdateListing, adminAddImage, adminRemoveImage, adminReorderImages } from '../../api/admin';
import { getSignedUploadUrl, confirmUpload } from '../../api/media';
import type { Listing } from '../../api/types';
import LuxuryImage from '../ui/LuxuryImage';

interface EditProductModalProps {
  listing: Listing | null;
  onClose: () => void;
  onSave: () => void; 
}

const PERF_TYPES = ["Eau de Parfum", "Extrait de Parfum", "Eau de Toilette", "Eau de Cologne"];
const FAMILIES = ["Woody", "Floral", "Fresh", "Oriental"];

export default function EditProductModal({ listing, onClose, onSave }: EditProductModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Eau de Parfum');
  const [family, setFamily] = useState('Woody');
  const [ml, setMl] = useState('50');
  const [badge, setBadge] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  
  const [images, setImages] = useState<Listing['images']>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setPrice(String(listing.price));
      setType(listing.category?.name || 'Eau de Parfum');
      setFamily(listing.category?.name || 'Woody');
      setActive(listing.status === 'active');
      setImages([...listing.images].sort((a,b) => a.sort_order - b.sort_order));
    }
  }, [listing]);

  if (!listing) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await adminUpdateListing(listing.id, {
        title,
        price: Number(price),
        status: active ? 'active' : 'hidden',
        description: notes,
      });
      onSave();
      onClose();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { upload_url, storage_key } = await getSignedUploadUrl(file.name, file.type);
      await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await confirmUpload(storage_key, { alt_text: file.name });
      
      const newOrder = images.length;
      await adminAddImage(listing.id, { storage_key, sort_order: newOrder });
      onSave();
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      await adminRemoveImage(listing.id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      onSave();
    } catch {
      setError('Remove image failed.');
    }
  };

  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrop = async (dropId: string) => {
    if (!dragId || dragId === dropId) return;
    const dragIdx = images.findIndex(img => img.id === dragId);
    const dropIdx = images.findIndex(img => img.id === dropId);
    
    if(dragIdx === -1 || dropIdx === -1) return;

    const newImages = [...images];
    const [dragged] = newImages.splice(dragIdx, 1);
    newImages.splice(dropIdx, 0, dragged);
    
    setImages(newImages);
    try {
      await adminReorderImages(listing.id, { ordered_ids: newImages.map(img => img.id) });
      onSave();
    } catch {
      setError('Reorder failed.');
    }
    setDragId(null);
  };

  const inputCls = "w-full bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs font-light px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors duration-300";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase text-muted/35 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 bg-[#080604]/80 backdrop-blur-md flex items-center justify-center p-8">
      <div className="bg-[#0d0a07] border border-[#c9a96e]/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted/40 hover:text-rose-400">✕</button>
        
        <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-6">Edit Product: {listing.title}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Title</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
             <label className={labelCls}>Price (INR)</label>
             <input type="number" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <button 
              onClick={() => setActive(!active)}
              className={`w-full py-2.5 border text-xs tracking-widest uppercase transition-colors
                ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-muted/40'}`}
            >
              {active ? 'Active' : 'Hidden'}
            </button>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
               {PERF_TYPES.map(t => <option key={t} className="bg-[#130e08]">{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Scent Family</label>
            <select className={inputCls} value={family} onChange={e => setFamily(e.target.value)}>
               {FAMILIES.map(f => <option key={f} className="bg-[#130e08]">{f}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Scent Notes</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="col-span-2 pt-4 border-t border-[#c9a96e]/10 mt-2">
            <label className={labelCls}>Product Images</label>
            <p className="text-[10px] text-muted/30 mb-3">Drag to reorder</p>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div 
                  key={img.id}
                  draggable
                  onDragStart={() => setDragId(img.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => void handleDrop(img.id)}
                  className="relative w-20 h-28 border border-[#c9a96e]/20 cursor-move group overflow-hidden"
                >
                  <LuxuryImage src={`https://hadi-perfumes.s3.amazonaws.com/${img.storage_key}`} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => void handleRemoveImage(img.id)} className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">✕</button>
                  </div>
                </div>
              ))}
              
              <label className="w-20 h-28 border border-dashed border-[#c9a96e]/30 flex flex-col items-center justify-center cursor-pointer hover:bg-[#c9a96e]/5 hover:border-[#c9a96e]/60 transition-colors">
                 {uploading ? (
                   <span className="text-[9px] uppercase tracking-widest text-[#c9a96e]/60">...</span>
                 ) : (
                   <span className="text-[#c9a96e]/40 text-2xl">+</span>
                 )}
                 <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e)} disabled={uploading}/>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-rose-400 text-xs mt-4">⚠ {error}</p>}

        <div className="flex gap-3 mt-8">
          <button onClick={() => void handleSave()} disabled={saving} className="bg-[#c9a96e] text-[#080604] px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-[#e8c87a] disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
