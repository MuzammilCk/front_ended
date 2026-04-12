import { useState } from 'react';

export default function HomepageCmsTab() {
  const handleSave = () => {
    alert("Not implemented on backend yet.");
  };

  const inputCls = "w-full bg-[#080604] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs font-light px-4 py-2.5 outline-none focus:border-[#c9a96e]/50 placeholder-muted/20 transition-colors";

  return (
    <div className="space-y-6 max-w-4xl">
       <div className="border border-[#c9a96e]/10 p-8 bg-[#0d0a07]">
         <p className="font-serif text-2xl font-light text-[#e8dcc8] mb-1">Homepage CMS</p>
         <p className="text-[10px] uppercase tracking-widest text-muted/30 mb-8">Manage the storefront homepage content</p>

         <div className="space-y-6">
           <div>
             <label className="block text-[10px] uppercase tracking-widest text-muted/40 mb-1.5">Hero Headline</label>
             <input className={inputCls} placeholder="e.g. The Essence of Royalty" defaultValue="The Essence of Royalty" />
           </div>

           <div>
             <label className="block text-[10px] uppercase tracking-widest text-muted/40 mb-1.5">Hero Subtitle</label>
             <textarea className={`${inputCls} min-h-[80px]`} placeholder="Subtext..." defaultValue="Discover our exclusive collection of luxury fragrances crafted from rare ingredients worldwide." />
           </div>

           <div>
             <label className="block text-[10px] uppercase tracking-widest text-muted/40 mb-1.5">Hero Image</label>
             <div className="flex gap-4 items-center">
                <div className="w-24 h-32 border border-[#c9a96e]/20 bg-[#080604] flex items-center justify-center text-muted/40 text-[9px] uppercase tracking-widest">Preview</div>
                <button className="border border-[#c9a96e]/20 text-[#c9a96e] px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-[#c9a96e]/5 transition-colors">Replace Media</button>
             </div>
           </div>

           <div className="pt-6 mt-6 border-t border-[#c9a96e]/10">
              <button 
                 onClick={handleSave}
                 className="bg-[#c9a96e] text-[#080604] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-light hover:bg-[#e8c87a] transition-colors"
              >
                 Save Content
              </button>
           </div>
         </div>
       </div>
    </div>
  );
}
