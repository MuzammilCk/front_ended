import { useState, useEffect } from 'react';
import { adminUpdateListing, adminAddImage, adminRemoveImage, adminReorderImages } from '../../api/admin';
import { getSignedUploadUrl, confirmUpload } from '../../api/media';
import type { Listing } from '../../api/types';
import LuxuryImage from '../ui/LuxuryImage';
import { GripVertical } from 'lucide-react';

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

  // Drag and drop states
  const [dragId, setDragId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setPrice(String(listing.price));
      setType(listing.category?.name || 'Eau de Parfum');
      setFamily(listing.category?.name || 'Woody');
      setNotes(listing.description || '');
      setActive(listing.status === 'active');
      setImages([...listing.images].sort((a,b) => a.sort_order - b.sort_order));
    }
  }, [listing]);

  if (!listing) return null;

  const hasChanges = 
    title !== listing.title || 
    price !== String(listing.price) || 
    active !== (listing.status === 'active') ||
    notes !== (listing.description || '') ||
    type !== (listing.category?.name || 'Eau de Parfum') ||
    family !== (listing.category?.name || 'Woody');

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

  const handleMultipleImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 5 - images.length);
    if (fileArray.length === 0) return;
    
    setUploading(true);
    setError('');
    
    try {
      let currentOrderIndex = images.length;
      
      const uploadPromises = fileArray.map(async (file) => {
        const { upload_url, storage_key } = await getSignedUploadUrl(file.name, file.type);
        await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        await confirmUpload(storage_key, { alt_text: file.name });
        
        // Add image to listing via API concurrently
        const thisOrder = currentOrderIndex++;
        await adminAddImage(listing.id, { storage_key, sort_order: thisOrder });
        return { id: `temp-${Date.now()}-${thisOrder}`, storage_key, sort_order: thisOrder }; // Temporary optimisic injection
      });
      
      await Promise.all(uploadPromises);
      onSave(); 
      // Note: we just call onSave() here to trigger a parent refetch to guarantee accurate DB IDs.
      // Alternatively we could re-hit the details endpoint. The parent refreshListings handle this nicely!
    } catch {
      setError('One or more uploads failed. Please try again.');
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
  const labelCls = "admin-label";

  return (
    <div className="fixed inset-0 z-50 bg-[#080604]/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8">
      <div className="bg-[#0d0a07] border border-[#c9a96e]/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl rounded-sm">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted/40 hover:text-rose-400 text-xl hover:scale-110 transition-transform">✕</button>
        
        <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-8 pr-12 truncate">Edit Product: {listing.title}</p>
        
        <div className="grid grid-cols-2 gap-6">
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
              className={`w-full py-2.5 border font-sans text-[10px] tracking-widest uppercase transition-colors
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
            <textarea className={`${inputCls} min-h-[80px] resize-none`} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="col-span-2 pt-6 border-t border-[#c9a96e]/10 mt-2">
            <label className={labelCls}>Media Gallery</label>
            <div className="flex flex-wrap gap-4 mt-3">
              {images.map((img) => (
                <div 
                  key={img.id}
                  draggable
                  onDragStart={() => { setDragId(img.id); setDraggingId(img.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(e) => { e.preventDefault(); setDragTargetId(img.id); }}
                  onDragLeave={() => setDragTargetId(null)}
                  onDrop={() => { void handleDrop(img.id); setDragTargetId(null); }}
                  className={`relative w-24 h-32 border cursor-move group overflow-hidden transition-all duration-200
                    ${draggingId === img.id ? 'opacity-50 scale-95 border-white/20 shadow-none' : 'shadow-md'}
                    ${dragTargetId === img.id && draggingId !== img.id ? 'border-[#c9a96e] scale-[1.05] z-10' : 'border-[#c9a96e]/15'}
                  `}
                >
                  <LuxuryImage src={`https://hadi-perfumes.s3.amazonaws.com/${img.storage_key}`} alt="" className="w-full h-full object-cover" />
                  
                  {/* Drag handle icon */}
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-sm backdrop-blur-sm">
                    <GripVertical className="w-3.5 h-3.5 text-[#c9a96e]" />
                  </div>
                  
                  {/* Remove button */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 h-1/2">
                    <button 
                      onClick={() => void handleRemoveImage(img.id)} 
                      className="w-6 h-6 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Parallel Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#c9a96e]/60'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#c9a96e]/60'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-[#c9a96e]/60');
                  void handleMultipleImageUpload(e.dataTransfer.files);
                }}
                className={`w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed ${images.length >= 5 ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-[#c9a96e]/25 hover:border-[#c9a96e]/50 cursor-pointer'} text-center transition-colors`}
                onClick={() => {
                  if (images.length < 5) document.getElementById('edit-multi-image-input')?.click();
                }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
                    <span className="font-sans text-[9px] text-muted/40 uppercase tracking-widest">Uploading...</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#c9a96e]/40 text-2xl font-light">+</p>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-muted/30 mt-2">Add Media</p>
                  </div>
                )}
                <input
                  id="edit-multi-image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && void handleMultipleImageUpload(e.target.files)}
                  disabled={uploading || images.length >= 5}
                />
              </div>
            </div>
            {images.length > 1 && <p className="text-[10px] text-muted/30 mt-3 font-sans font-medium">Tip: Drag images to adjust their display order on the storefront.</p>}
          </div>
        </div>

        {error && <p className="text-rose-400 text-xs font-sans font-medium mt-4 bg-rose-500/10 border border-rose-500/20 px-3 py-2">⚠ {error}</p>}

        <div className="flex gap-4 mt-8 items-center border-t border-[#c9a96e]/10 pt-6">
          <button 
            onClick={() => void handleSave()} 
            disabled={saving || !hasChanges} 
            className="bg-[#c9a96e] text-[#080604] px-8 py-3.5 text-[10px] font-sans font-medium uppercase tracking-[0.2em] hover:bg-[#e8c87a] disabled:opacity-30 transition-all flex items-center gap-2"
          >
            {saving ? 'Committing changes...' : 'Save Changes'}
          </button>
          
          <button
             onClick={onClose}
             className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted/50 hover:text-white transition-colors"
          >
             Cancel
          </button>

          {hasChanges && (
            <div className="ml-auto flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-sans text-[10px] uppercase tracking-wider text-amber-400/80">Unsaved Changes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
