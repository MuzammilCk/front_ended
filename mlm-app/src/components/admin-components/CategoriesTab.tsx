import { useState, useEffect } from 'react';
import { adminCreateCategory, adminUpdateCategory, adminDeactivateCategory, adminGetCategories } from '../../api/admin';
import type { ProductCategory } from '../../api/types';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Interaction State
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string, slug?: string }>({});
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await adminGetCategories();
      setCategories(res);
    } catch {
      setFormError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCategories(); }, []);

  // 2. AUTO-GENERATE SLUG
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    } else if (!slugManuallyEdited && !name) {
      setSlug('');
    }
  }, [name, slugManuallyEdited]);

  // 4. LOADING & VALIDATION
  const handleSave = async () => {
    // Validation
    const errors: { name?: string, slug?: string } = {};
    if (!name.trim()) errors.name = 'Category name is required.';
    if (!slug.trim()) errors.slug = 'Slug is required.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    setFormError('');
    setSuccess('');
    setActionLoading(true);

    try {
       if (editId) {
         // 1. FIX API CALL BUG - Only name, slug, description passed
         await adminUpdateCategory(editId, { name, slug, description });
         setSuccess(`Category "${name}" updated successfully.`);
       } else {
         await adminCreateCategory({ name, slug, description });
         setSuccess(`Category "${name}" created successfully.`);
       }
       
       // Reset form
       setName(''); setSlug(''); setDescription(''); setEditId(null); setSlugManuallyEdited(false);
       await fetchCategories();
       
       // Clear success toast after a short delay
       setTimeout(() => setSuccess(''), 4000);
    } catch {
       setFormError('Save failed. Please try again.');
    } finally {
       setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, currentlyActive: boolean) => {
    // 4. Confirmation step before deactivating
    if (!window.confirm("Deactivate this category? Products in this category will remain but won't be filterable.")) return;
    
    setFormError('');
    setSuccess('');
    try {
       await adminDeactivateCategory(id);
       await fetchCategories();
       setSuccess('Category successfully deactivated.');
       setTimeout(() => setSuccess(''), 4000);
    } catch {
       setFormError('Deactivate failed.');
    }
  };

  const startEdit = (c: ProductCategory) => {
    setEditId(c.id); 
    setName(c.name); 
    setDescription(c.description || '');
    setSlug(c.slug);
    setSlugManuallyEdited(true); // Don't auto-override existing slug unless they want to
    setFormError('');
    setFieldErrors({});
    setSuccess('');
  };

  const resetForm = () => {
    setEditId(null); 
    setName(''); 
    setSlug('');
    setDescription(''); 
    setSlugManuallyEdited(false);
    setFormError('');
    setFieldErrors({});
  };
  
  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";
  // 3. TYPOGRAPHY FIX
  const labelCls = "admin-label";

  return (
    <div className="space-y-6 flex gap-8">
      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <div className="w-4 h-4 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
            <p className="text-muted/40 font-sans tracking-wide text-xs">Loading structure...</p>
          </div>
        ) : null}
        
        {categories.map(c => (
           <div key={c.id} className="border border-[#c9a96e]/10 p-5 bg-[#0d0a07] flex justify-between items-center group hover:border-[#c9a96e]/30 transition-colors">
              <div>
                <p className="font-serif text-[#e8dcc8] text-xl flex items-center gap-3 relative">
                  {c.name}
                  {!c.is_active && <span className="font-sans font-medium text-[9px] uppercase tracking-widest text-[#c9a96e]/50 bg-[#c9a96e]/10 border border-[#c9a96e]/20 px-2 py-0.5 rounded-sm">Inactive</span>}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-sans text-[10px] text-[#c9a96e]/60 bg-[#c9a96e]/5 px-1.5 py-0.5 font-mono">/{c.slug}</span>
                  <span className="text-muted/40 font-sans text-xs">· {c.description || 'No description provided'}</span>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => startEdit(c)} 
                  className="font-sans font-medium text-[10px] uppercase tracking-widest text-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors"
                >
                  Edit Menu
                </button>
                {c.is_active && (
                  <button 
                    onClick={() => void handleDelete(c.id, c.is_active)} 
                    className="font-sans font-medium text-[10px] uppercase tracking-widest text-rose-500/40 hover:text-rose-400 transition-colors"
                  >
                    Deactivate
                  </button>
                )}
              </div>
           </div>
        ))}
      </div>
      
      <div className="w-[380px] shrink-0 border border-[#c9a96e]/10 p-7 bg-[#0d0a07] h-fit sticky top-6 shadow-xl">
        <p className="font-serif text-2xl mb-6 text-[#e8dcc8] tracking-tight">{editId ? 'Edit Configuration' : 'New Category'}</p>
        
        {formError && <p className="text-rose-400 font-sans font-medium text-xs mb-4 bg-rose-500/10 border border-rose-500/20 px-4 py-3 tracking-wide">⚠ {formError}</p>}
        {success && <p className="text-emerald-400 font-sans font-medium text-xs mb-4 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 tracking-wide">✓ {success}</p>}
        
        <div className="mb-4">
          <label className={labelCls}>Category Name</label>
          <input className={`${inputCls} ${fieldErrors.name ? 'border-rose-500/40' : ''}`} placeholder="e.g. Eau de Parfum" value={name} onChange={e => setName(e.target.value)} />
          {fieldErrors.name && <p className="text-rose-400 text-[10px] font-sans font-medium mt-1">{fieldErrors.name}</p>}
        </div>

        <div className="mb-4">
          <label className={labelCls}>URL Identifier (Slug)</label>
          <input 
            className={`${inputCls} bg-[#0A0705] text-[#c9a96e]/80 ${fieldErrors.slug ? 'border-rose-500/40' : ''}`} 
            placeholder="e.g. eau-de-parfum" 
            value={slug} 
            onChange={e => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }} 
          />
          <div className="flex justify-between items-center mt-1">
            {fieldErrors.slug ? (
              <p className="text-rose-400 text-[10px] font-sans font-medium">{fieldErrors.slug}</p>
            ) : <span />}
            <button
              onClick={() => {
                setSlugManuallyEdited(false);
                setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
              }}
              className="text-[#c9a96e]/40 hover:text-[#c9a96e] font-sans text-[9px] uppercase tracking-widest transition-colors font-medium ml-auto"
            >
              ↺ Regenerate
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} min-h-[90px] resize-none`} placeholder="Sub-text displayed on the collection page..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => void handleSave()} 
            disabled={actionLoading}
            className="bg-[#c9a96e] text-[#080604] px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-medium flex-1 hover:bg-[#e8c87a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
             {actionLoading ? (
               <>
                 <div className="w-3 h-3 border-2 border-[#080604]/30 border-t-[#080604] rounded-full animate-spin" />
                 Saving...
               </>
             ) : 'Save Structure'}
          </button>
          {editId && (
            <button 
              onClick={resetForm} 
              disabled={actionLoading}
              className="border border-[#c9a96e]/20 text-[#c9a96e] px-5 py-3 text-[10px] font-medium uppercase tracking-widest hover:bg-[#c9a96e]/5 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
