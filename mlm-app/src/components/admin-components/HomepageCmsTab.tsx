import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHomepageContent } from '../../api/homepage';
import { adminUpsertHomepageSection, adminGetListings } from '../../api/admin';
import type { Listing } from '../../api/types';
import { Search, GripVertical, X, Check, Plus } from 'lucide-react';

const CMS_TABS = [
  { id: 'hero', label: 'Hero Section' },
  { id: 'featured', label: 'Featured Collection' },
  { id: 'brand', label: 'Brand Statement' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'families', label: 'Scent Families' },
];

export default function HomepageCmsTab() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('hero');
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Hero State
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [heroEyebrow, setHeroEyebrow] = useState('');
  const [heroCtaText, setHeroCtaText] = useState('');
  const [heroCtaLink, setHeroCtaLink] = useState('');

  // Brand Statement State
  const [brandHeadline, setBrandHeadline] = useState('');
  const [brandBody, setBrandBody] = useState('');
  const [brandStats, setBrandStats] = useState<{ value: string; label: string }[]>([]);

  // Featured Collection State
  const [selectedListings, setSelectedListings] = useState<
    { listing_id: string; family: string; badge: string | null; ml: string; notes: string; intensity: number }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Testimonial State & Scent Family State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);

  const { data: homepageData, isLoading } = useQuery({
    queryKey: ['homepage-content'],
    queryFn: getHomepageContent,
  });

  // Fetch all active listings for the product picker
  const { data: listingsData } = useQuery({
    queryKey: ['admin-cms-listings'],
    queryFn: () => adminGetListings({ limit: 200, status: 'active' }),
    enabled: activeTab === 'featured',
  });

  const allListings: Listing[] = listingsData?.data ?? [];

  const filteredListings = useMemo(() => {
    const selectedIds = new Set(selectedListings.map(s => s.listing_id));
    let filtered = allListings.filter(l => !selectedIds.has(l.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        l => l.title.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [allListings, selectedListings, searchQuery]);

  useEffect(() => {
    if (homepageData) {
      if (homepageData.hero) {
        setHeroHeadline(homepageData.hero.headline || '');
        setHeroSubheadline(homepageData.hero.subheadline || '');
        setHeroEyebrow(homepageData.hero.eyebrow || '');
        setHeroCtaText(homepageData.hero.cta_text || '');
        setHeroCtaLink(homepageData.hero.cta_link || '');
      }
      if (homepageData.brand_statement) {
        setBrandHeadline(homepageData.brand_statement.headline || '');
        setBrandBody(homepageData.brand_statement.body || '');
        setBrandStats(homepageData.brand_statement.stats || []);
      }
      if (homepageData.testimonials) setTestimonials([...homepageData.testimonials]);
      if (homepageData.scent_families) setFamilies([...homepageData.scent_families]);
      // Load featured collection items
      if (homepageData.featured_collection) {
        setSelectedListings(
          homepageData.featured_collection.map((item: any) => ({
            listing_id: item.listing_id || item.id || '',
            family: item.family || '',
            badge: item.badge || null,
            ml: item.ml || '50',
            notes: item.notes || '',
            intensity: item.intensity || 70,
          })),
        );
      }
    }
  }, [homepageData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ sectionKey, content }: { sectionKey: string; content: Record<string, any> }) => {
      return adminUpsertHomepageSection(sectionKey, { content });
    },
    onSuccess: () => {
      setSaveSuccess('Section saved successfully. Changes are live.');
      setSaveError('');
      // Invalidate homepage cache so the storefront reflects changes
      void queryClient.invalidateQueries({ queryKey: ['homepage-content'] });
      void queryClient.invalidateQueries({ queryKey: ['homepage'] });
      setTimeout(() => setSaveSuccess(''), 4000);
    },
    onError: (err: any) => {
      setSaveError(err?.message || 'Failed to save section. Please try again.');
      setSaveSuccess('');
    },
  });

  const handleSave = () => {
    let sectionKey = '';
    let content: Record<string, any> = {};

    switch (activeTab) {
      case 'hero':
        sectionKey = 'hero';
        content = {
          headline: heroHeadline,
          subheadline: heroSubheadline,
          eyebrow: heroEyebrow,
          cta_text: heroCtaText,
          cta_link: heroCtaLink,
        };
        break;
      case 'brand':
        sectionKey = 'brand_statement';
        content = {
          headline: brandHeadline,
          body: brandBody,
          stats: brandStats,
        };
        break;
      case 'featured':
        sectionKey = 'featured_collection';
        content = {
          items: selectedListings.map(item => ({
            listing_id: item.listing_id,
            family: item.family,
            badge: item.badge,
            ml: item.ml,
            notes: item.notes,
            intensity: item.intensity,
          })),
        };
        break;
      case 'testimonials':
        sectionKey = 'testimonials';
        content = { items: testimonials };
        break;
      case 'families':
        sectionKey = 'scent_families';
        content = { items: families };
        break;
    }

    if (sectionKey) {
      saveMutation.mutate({ sectionKey, content });
    }
  };

  const addListingToFeatured = (listing: Listing) => {
    if (selectedListings.length >= 6) return;
    setSelectedListings(prev => [
      ...prev,
      {
        listing_id: listing.id,
        family: listing.category?.name || 'Signature',
        badge: null,
        ml: '50',
        notes: listing.description || '',
        intensity: 70,
      },
    ]);
  };

  const removeFromFeatured = (listingId: string) => {
    setSelectedListings(prev => prev.filter(s => s.listing_id !== listingId));
  };

  const updateFeaturedItem = (idx: number, field: string, value: any) => {
    setSelectedListings(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });
  };

  const moveItem = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= selectedListings.length) return;
    setSelectedListings(prev => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-3 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";
  const labelCls = "admin-label";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-6xl">
        <div className="flex gap-2 animate-pulse">
           {[1,2,3,4,5].map(i => <div key={i} className="w-24 h-8 bg-[#c9a96e]/10 rounded-sm" />)}
        </div>
        <div className="flex gap-8">
           <div className="w-[500px] h-96 bg-[#c9a96e]/5 rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
       <div className="flex items-center justify-between">
         <p className="font-serif text-3xl font-light text-[#e8dcc8]">Storefront Architecture</p>
         <button 
            onClick={() => setShowPreview(!showPreview)}
            className={`font-sans text-[10px] uppercase font-medium tracking-widest px-6 py-2 border transition-all ${showPreview ? 'bg-[#c9a96e]/10 border-[#c9a96e]/30 text-[#c9a96e]' : 'border-white/10 text-muted/50 hover:text-white'}`}
         >
            {showPreview ? 'Hide Preview' : 'Show Live Preview'}
         </button>
       </div>

       {saveSuccess && (
         <div className="border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 font-sans font-medium tracking-wide text-[11px] text-emerald-400 flex items-center gap-2">
           <Check size={14} /> {saveSuccess}
         </div>
       )}
       {saveError && (
         <div className="border border-rose-500/20 bg-rose-500/5 px-6 py-4 font-sans font-medium tracking-wide text-[11px] text-rose-400">
           ⚠ {saveError}
         </div>
       )}

       <div className="flex gap-2 border-b border-[#c9a96e]/10 pb-4">
         {CMS_TABS.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`font-sans text-[11px] uppercase tracking-widest font-medium px-5 py-2.5 transition-colors rounded-sm ${activeTab === tab.id ? 'bg-[#c9a96e] text-black shadow-[0_0_15px_rgba(201,169,110,0.15)]' : 'bg-white/5 border border-white/5 text-muted/40 hover:bg-white/10 hover:text-white'}`}
           >
             {tab.label}
           </button>
         ))}
       </div>

       <div className="flex items-start gap-8">
         {/* Editor Form Panel */}
         <div className={`border border-[#c9a96e]/10 bg-[#0d0a07] p-8 shrink-0 transition-all ${showPreview ? 'w-[450px]' : 'w-full max-w-3xl'} ${activeTab === 'featured' ? 'w-full max-w-full' : ''} shadow-xl`}>
           {activeTab === 'hero' && (
             <div>
               <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Hero Section Editor</p>
               <p className="font-sans text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-8 font-medium">Above-the-fold components</p>
               
               <label className={labelCls}>Eyebrow Banner</label>
               <input className={inputCls} placeholder="e.g. New Collection Available" value={heroEyebrow} onChange={(e) => setHeroEyebrow(e.target.value)} />
               
               <label className={labelCls}>Main Headline</label>
               <input className={inputCls} placeholder="e.g. The Essence of Royalty" value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} />

               <label className={labelCls}>Subheadline</label>
               <textarea className={`${inputCls} min-h-[90px] resize-none`} placeholder="Subtext describing the collection..." value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} />
               
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className={labelCls}>CTA Origin Text</label>
                   <input className={inputCls} placeholder="e.g. Shop Now" value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} />
                 </div>
                 <div className="flex-1">
                   <label className={labelCls}>CTA Endpoint Link</label>
                   <input className={inputCls} placeholder="e.g. /shop" value={heroCtaLink} onChange={(e) => setHeroCtaLink(e.target.value)} />
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'featured' && (
             <div>
               <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Featured Collection Editor</p>
               <p className="font-sans text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-8 font-medium">Select up to 6 products from your catalogue</p>

               {/* Selected products */}
               <div className="mb-8">
                 <label className={labelCls}>Selected Products ({selectedListings.length}/6)</label>
                 {selectedListings.length === 0 ? (
                   <div className="border border-dashed border-white/10 p-8 text-center">
                     <p className="font-sans text-xs text-muted/40">No products selected. Search and add products below.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {selectedListings.map((item, idx) => {
                       const listing = allListings.find(l => l.id === item.listing_id);
                       return (
                         <div key={item.listing_id} className="flex items-center gap-4 border border-[#c9a96e]/10 bg-[#0A0705] p-4 group hover:border-[#c9a96e]/30 transition-colors">
                           <div className="flex flex-col gap-1 shrink-0">
                             <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-muted/30 hover:text-[#c9a96e] disabled:opacity-20 text-[10px]">▲</button>
                             <GripVertical size={14} className="text-muted/20" />
                             <button onClick={() => moveItem(idx, 1)} disabled={idx === selectedListings.length - 1} className="text-muted/30 hover:text-[#c9a96e] disabled:opacity-20 text-[10px]">▼</button>
                           </div>
                           
                           <div className="flex-1 min-w-0">
                             <p className="font-serif text-lg text-[#e8dcc8] truncate">{listing?.title || item.listing_id.slice(0, 8)}</p>
                             <p className="font-sans text-[10px] text-muted/40 mt-0.5">
                               SKU: {listing?.sku || 'N/A'} · INR {listing ? parseFloat(listing.price).toLocaleString() : '—'}
                             </p>
                           </div>

                           {/* Editable overrides */}
                           <div className="flex gap-2 items-center shrink-0">
                             <div>
                               <label className="font-sans text-[8px] uppercase tracking-widest text-muted/30 block mb-1">Family</label>
                               <input className="bg-[#080604] border border-[#c9a96e]/10 text-[#e8dcc8] text-[10px] px-2 py-1.5 w-20 outline-none focus:border-[#c9a96e]/50" value={item.family} onChange={e => updateFeaturedItem(idx, 'family', e.target.value)} />
                             </div>
                             <div>
                               <label className="font-sans text-[8px] uppercase tracking-widest text-muted/30 block mb-1">Badge</label>
                               <select className="bg-[#080604] border border-[#c9a96e]/10 text-[#e8dcc8] text-[10px] px-2 py-1.5 w-24 outline-none" value={item.badge || ''} onChange={e => updateFeaturedItem(idx, 'badge', e.target.value || null)}>
                                 <option value="" className="bg-[#130e08]">None</option>
                                 <option value="New" className="bg-[#130e08]">New</option>
                                 <option value="Bestseller" className="bg-[#130e08]">Bestseller</option>
                                 <option value="Limited" className="bg-[#130e08]">Limited</option>
                                 <option value="Exclusive" className="bg-[#130e08]">Exclusive</option>
                               </select>
                             </div>
                             <div>
                               <label className="font-sans text-[8px] uppercase tracking-widest text-muted/30 block mb-1">ML</label>
                               <select className="bg-[#080604] border border-[#c9a96e]/10 text-[#e8dcc8] text-[10px] px-2 py-1.5 w-16 outline-none" value={item.ml} onChange={e => updateFeaturedItem(idx, 'ml', e.target.value)}>
                                 {['30', '50', '75', '100'].map(v => <option key={v} value={v} className="bg-[#130e08]">{v}</option>)}
                               </select>
                             </div>
                           </div>

                           <button onClick={() => removeFromFeatured(item.listing_id)} className="text-rose-400/30 hover:text-rose-400 transition-colors shrink-0 p-1">
                             <X size={16} />
                           </button>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>

               {/* Product picker */}
               {selectedListings.length < 6 && (
                 <div>
                   <label className={labelCls}>Add Products from Catalogue</label>
                   <div className="relative mb-4">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/30" />
                     <input
                       className={`${inputCls} pl-9`}
                       placeholder="Search by name or SKU..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                     />
                   </div>
                   <div className="border border-[#c9a96e]/10 max-h-[300px] overflow-y-auto">
                     {filteredListings.length === 0 ? (
                       <p className="py-8 text-center font-sans text-xs text-muted/40">
                         {allListings.length === 0 ? 'Loading products...' : 'No matching products found.'}
                       </p>
                     ) : (
                       filteredListings.slice(0, 20).map(listing => (
                         <div
                           key={listing.id}
                           className="flex items-center gap-4 px-4 py-3 border-b border-[#c9a96e]/5 last:border-0 hover:bg-[#c9a96e]/5 transition-colors cursor-pointer group"
                           onClick={() => addListingToFeatured(listing)}
                         >
                           <div className="flex-1 min-w-0">
                             <p className="font-serif text-sm text-[#e8dcc8] truncate">{listing.title}</p>
                             <p className="font-sans text-[10px] text-muted/40">
                               {listing.sku} · INR {parseFloat(listing.price).toLocaleString()} · {listing.category?.name || 'Uncategorized'}
                             </p>
                           </div>
                           <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#c9a96e]/10 border border-[#c9a96e]/30 text-[#c9a96e] px-3 py-1.5 font-sans text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                             <Plus size={12} /> Add
                           </button>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'brand' && (
             <div>
               <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Brand Statement Editor</p>
               <p className="font-sans text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-8 font-medium">Core storytelling blocks</p>
               
               <label className={labelCls}>Section Headline</label>
               <input className={inputCls} placeholder="e.g. A Legacy of Scent" value={brandHeadline} onChange={(e) => setBrandHeadline(e.target.value)} />

               <label className={labelCls}>Brand Body Manifest</label>
               <textarea className={`${inputCls} min-h-[140px] resize-none`} placeholder="Deep storytelling body copy..." value={brandBody} onChange={(e) => setBrandBody(e.target.value)} />
               
               <label className={labelCls}>Numerical Accents (Stats)</label>
               <div className="space-y-3">
                 {brandStats.map((stat, idx) => (
                   <div key={idx} className="flex gap-2">
                     <input className={`${inputCls} w-24`} placeholder="Value" value={stat.value} onChange={(e) => {
                       const ns = [...brandStats]; ns[idx].value = e.target.value; setBrandStats(ns);
                     }} />
                     <input className={`${inputCls} flex-1`} placeholder="Label" value={stat.label} onChange={(e) => {
                       const ns = [...brandStats]; ns[idx].label = e.target.value; setBrandStats(ns);
                     }} />
                     <button onClick={() => setBrandStats(brandStats.filter((_, i) => i !== idx))} className="px-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-sans text-[10px] uppercase tracking-widest border border-rose-500/20 border-l-0">X</button>
                   </div>
                 ))}
                 <button onClick={() => setBrandStats([...brandStats, { value: '', label: '' }])} className="text-[#c9a96e]/50 hover:text-[#c9a96e] font-sans text-[10px] uppercase font-medium tracking-widest decoration-dotted underline underline-offset-4">+ Add Stat</button>
               </div>
             </div>
           )}
           
           {activeTab === 'testimonials' && (
             <div>
               <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Testimonials Editor</p>
               <p className="font-sans text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-8 font-medium">Customer social proof engine</p>
               <p className="font-sans text-xs text-muted/50 py-12 text-center bg-[#080604] border border-white/5">
                 [ Testimonial Grid Array Rendering ]
               </p>
             </div>
           )}

           {activeTab === 'families' && (
             <div>
               <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Scent Families Editor</p>
               <p className="font-sans text-[10px] uppercase tracking-widest text-[#c9a96e]/40 mb-8 font-medium">Category mappings matrix</p>
               <p className="font-sans text-xs text-muted/50 py-12 text-center bg-[#080604] border border-white/5">
                 [ Family Pipeline Array Rendering ]
               </p>
             </div>
           )}

           <div className="pt-8 mt-8 border-t border-[#c9a96e]/10">
              <button 
                 onClick={handleSave}
                 disabled={saveMutation.isPending}
                 className="bg-[#c9a96e] text-[#080604] px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#e8c87a] transition-all rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 {saveMutation.isPending ? (
                   <>
                     <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                     Saving...
                   </>
                 ) : (
                   <span>Save {CMS_TABS.find(t => t.id === activeTab)?.label} Node</span>
                 )}
              </button>
           </div>
         </div>

         {/* Live Preview Panel */}
         {showPreview && activeTab !== 'featured' && (
           <div className="flex-1 bg-[#0A0705]/80 border border-[#c9a96e]/20 p-12 min-h-full flex items-center justify-center relative overflow-hidden shadow-2xl rounded-sm group">
             {/* Abstract luxury preview lines */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-[#c9a96e]/5 rounded-full -translate-y-1/2 translate-x-1/4 animate-[spin_60s_linear_infinite]" />
             
             {activeTab === 'hero' ? (
               <div className="relative text-center z-10 max-w-lg space-y-4">
                 <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-medium text-[#c9a96e] mb-4 drop-shadow-[0_0_10px_rgba(201,169,110,0.5)]">{heroEyebrow || 'Eyebrow text'}</p>
                 <h1 className="font-serif text-5xl font-light text-[#e8dcc8] leading-tight" style={{ textShadow: "0px 4px 20px rgba(0,0,0,0.8)" }}>{heroHeadline || 'Hero Headline'}</h1>
                 <p className="font-sans text-sm font-light text-white/50 px-8 leading-relaxed py-2">{heroSubheadline || 'Hero Subtext...'}</p>
                 <div className="pt-4">
                   <button className="bg-[#c9a96e] text-[#080604] font-sans font-medium text-xs tracking-[0.2em] uppercase px-8 py-4 shadow-xl hover:scale-105 transition-transform">
                     {heroCtaText || 'CTA Button'}
                   </button>
                 </div>
               </div>
             ) : activeTab === 'brand' ? (
               <div className="relative z-10 max-w-xl space-y-6 text-center">
                 <h2 className="font-serif text-3xl font-light text-[#c9a96e]">{brandHeadline || 'Brand Headline'}</h2>
                 <p className="font-sans text-xs text-white/60 leading-loose mx-auto max-w-md">{brandBody || 'Brand body...'}</p>
                 <div className="flex justify-center gap-12 pt-6">
                   {brandStats.map((s, i) => (
                     s.value && s.label && (
                       <div key={i}>
                         <p className="font-serif text-3xl text-[#e8dcc8]">{s.value}</p>
                         <p className="font-sans text-[9px] uppercase tracking-widest text-[#c9a96e]/60">{s.label}</p>
                       </div>
                     )
                   ))}
                 </div>
               </div>
             ) : null}
             
             <div className="absolute top-4 right-6 flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                 <span className="font-sans text-[9px] font-medium text-emerald-400/80 uppercase tracking-widest">Live Document Preview</span>
             </div>
           </div>
         )}
       </div>
    </div>
  );
}
