import { useState, useEffect } from 'react';
import { adminCreateCategory, adminUpdateCategory, adminDeactivateCategory, adminGetCategories } from '../../api/admin';
import type { ProductCategory } from '../../api/types';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await adminGetCategories();
      setCategories(res);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCategories(); }, []);

  const handleSave = async () => {
    try {
       if (editId) {
         await adminUpdateCategory(editId, { name, description, image_url: '' });
       } else {
         await adminCreateCategory({ name, description, image_url: '' });
       }
       setName(''); setDescription(''); setEditId(null);
       await fetchCategories();
    } catch {
       setError('Save failed.');
    }
  };

  const handleDelete = async (id: string, currentlyActive: boolean) => {
    try {
       // Since the api is actually DEACTIVATE, and the UI says deactivate
       await adminDeactivateCategory(id);
       await fetchCategories();
    } catch {
       setError('Deactivate failed.');
    }
  };
  
  const inputCls = "bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-3 py-2 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full mb-3";

  return (
    <div className="space-y-6 flex gap-8">
      <div className="flex-1 space-y-4">
        {loading ? <p className="text-muted/40 text-xs py-8">Loading configuration...</p> : null}
        {categories.map(c => (
           <div key={c.id} className="border border-[#c9a96e]/10 p-4 bg-[#0d0a07] flex justify-between items-center group hover:border-[#c9a96e]/30 transition-colors">
              <div>
                <p className="font-serif text-[#e8dcc8] text-lg flex items-center gap-2">
                  {c.name}
                  {!c.is_active && <span className="text-[9px] uppercase tracking-widest text-muted/30 border border-white/10 px-2 py-0.5 ml-2">Inactive</span>}
                </p>
                <p className="text-muted/40 text-xs mt-1">{c.description || 'No description provided'}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditId(c.id); setName(c.name); setDescription(c.description || ''); }} 
                  className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 hover:text-[#c9a96e]"
                >
                  Edit
                </button>
                {c.is_active && (
                  <button 
                    onClick={() => void handleDelete(c.id, c.is_active)} 
                    className="text-[10px] uppercase tracking-widest text-rose-500/50 hover:text-rose-400"
                  >
                    Deactivate
                  </button>
                )}
              </div>
           </div>
        ))}
      </div>
      
      <div className="w-80 shrink-0 border border-[#c9a96e]/10 p-6 bg-[#0d0a07] h-fit sticky top-6">
        <p className="font-serif text-xl mb-4 text-[#e8dcc8]">{editId ? 'Edit Category' : 'New Category'}</p>
        
        {error && <p className="text-rose-400 text-[10px] uppercase tracking-widest mb-4">⚠ {error}</p>}
        
        <label className="block text-[9px] uppercase tracking-widest text-muted/30 mb-1">Name</label>
        <input className={inputCls} placeholder="e.g. Eau de Parfum" value={name} onChange={e => setName(e.target.value)} />
        
        <label className="block text-[9px] uppercase tracking-widest text-muted/30 mb-1">Description</label>
        <textarea className={`${inputCls} min-h-[80px]`} placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} />
        
        <div className="flex gap-2 mt-2">
          <button onClick={() => void handleSave()} className="bg-[#c9a96e] text-[#080604] px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-light flex-1 hover:bg-[#e8c87a] transition-colors">
             Save Category
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setName(''); setDescription(''); }} className="border border-[#c9a96e]/20 text-[#c9a96e] px-4 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#c9a96e]/5 transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
