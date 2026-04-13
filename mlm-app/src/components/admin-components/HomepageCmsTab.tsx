import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHomepageContent } from '../../api/homepage';

const CMS_TABS = [
  { id: 'hero', label: 'Hero Section' },
  { id: 'brand', label: 'Brand Statement' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'families', label: 'Scent Families' },
];

export default function HomepageCmsTab() {
  const [activeTab, setActiveTab] = useState('hero');
  const [showPreview, setShowPreview] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');

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

  // Testimonial State & Scent Family State mapped here simply for UI demonstration
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);

  const { data: homepageData, isLoading } = useQuery({
    queryKey: ['homepage-content'],
    queryFn: getHomepageContent,
  });

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
    }
  }, [homepageData]);

  const handleSave = () => {
    setSavingMsg('Backend endpoint coming soon — changes will sync once deployed.');
    setTimeout(() => setSavingMsg(''), 5000);
  };

  const inputCls = "bg-[#0A0705] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs px-4 py-3 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 w-full transition-colors font-sans";
  const labelCls = "admin-label";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-6xl">
        <div className="flex gap-2 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="w-24 h-8 bg-[#c9a96e]/10 rounded-sm" />)}
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

       {savingMsg && (
         <div className="border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 font-sans font-medium tracking-wide text-[11px] text-emerald-400">
           🛈 {savingMsg}
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
         <div className={`border border-[#c9a96e]/10 bg-[#0d0a07] p-8 shrink-0 transition-all ${showPreview ? 'w-[450px]' : 'w-full max-w-3xl'} shadow-xl`}>
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
                 className="bg-[#c9a96e] text-[#080604] px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#e8c87a] transition-all rounded-sm flex items-center justify-center gap-2"
              >
                 <span>Save {CMS_TABS.find(t => t.id === activeTab)?.label} Node</span>
              </button>
           </div>
         </div>

         {/* Live Preview Panel */}
         {showPreview && (
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
