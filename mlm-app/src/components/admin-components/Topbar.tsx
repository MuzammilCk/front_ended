import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, LayoutDashboard, Package, ShoppingBag, ScrollText, ArrowRight, X } from 'lucide-react';

import { getUserFirstName } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useAdminData } from '../../context/AdminContext';
import { adminGetListings } from '../../api/admin';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Product Catalogue',
  new: 'Add New Perfume',       
  orders: 'Order History',
  audit: 'Audit Log',
  categories: 'Categories',
  inventory: 'Inventory',
  homepage: 'Homepage CMS',
  network: 'MLM Network',
  disputes: 'Disputes Desk',
  returns: 'Returns',
  payouts: 'Payouts',
  trust: 'Trust & Safety',
  finance: 'Finance',
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function Topbar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useAdminData();

  const name = getUserFirstName() ?? 'Admin';
  
  // Breadcrumb derivation
  const rawPath = location.pathname.replace(/^\/admin\/?/, '');
  const pathSegments = rawPath ? rawPath.split('/') : ['dashboard'];
  
  // E.g. "Admin / Trust & Safety / Disputes Desk"
  const formattedPath = ['Admin', ...pathSegments.map(s => TAB_TITLES[s] || s)].join(' / ');
  
  // Use the deepest segment for the main H1 title
  const deepestSegment = pathSegments[pathSegments.length - 1];
  const pageTitle = TAB_TITLES[deepestSegment] || deepestSegment || 'Dashboard';

  // Bell count from context
  const pendingOrderCount = orders.filter((o) => o.status === 'pending').length;

  // Command Palette State
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Global Keyboard Shortcut (cmd+K or ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Live Products Search for the command palette
  const { data: productResults } = useQuery({
    queryKey: ['admin-search-products', debouncedSearch],
    queryFn: () => adminGetListings({ limit: 10 }), // If the backend accepts '?q=', add it here in the future
    enabled: debouncedSearch.length > 0 && open,
  });

  const onSelectLink = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <>
      <style>{`
        [cmdk-group-heading] {
          padding: 0px 8px;
          margin-top: 12px;
          margin-bottom: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      
      <div className="sticky top-0 z-30 px-8 py-4 border-b border-[#c9a96e]/5 flex items-center justify-between bg-[#080604]/90 backdrop-blur-md">
        <div>
          <h1 className="font-serif text-2xl font-light text-[#e8dcc8] capitalize">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted/40">{formattedPath}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Fake Input to trigger Command Palette */}
          <button 
            onClick={() => setOpen(true)}
            className="group relative flex items-center w-64 pl-9 pr-4 py-2 bg-[#130e08] border border-[#c9a96e]/15 text-muted/40 hover:text-[#e8dcc8] text-xs font-light outline-none hover:border-[#c9a96e]/40 transition-colors text-left"
          >
            <Search className="absolute left-3 w-3.5 h-3.5" />
            <span>Search admin...</span>
            <span className="absolute right-3 flex items-center gap-1 text-[9px] border border-white/10 bg-white/5 px-1.5 rounded text-muted/50 group-hover:text-muted/70 transition-colors">
              <kbd className="font-sans">⌘</kbd><kbd className="font-sans">K</kbd>
            </span>
          </button>

          <div className="flex items-center gap-6 border-l border-[#c9a96e]/10 pl-8">
            <button className="relative text-muted/60 hover:text-[#e8dcc8] transition-colors group">
              <Bell className="w-5 h-5 group-hover:animate-pulse" />
              {pendingOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white border border-[#080604]">
                  {pendingOrderCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs text-[#e8dcc8] tracking-wide">{name} ▾</span>
              <button 
                onClick={() => void logout()}
                className="text-[10px] uppercase tracking-widest text-muted/60 hover:text-[#c9a96e] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CMDK Dialog Wrapper */}
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global Admin Command Menu"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div 
          className="w-full max-w-2xl bg-[#0d0a07] border border-[#c9a96e]/20 shadow-2xl rounded-sm overflow-hidden flex flex-col p-0"
          cmdk-root=""
        >
          <div className="flex items-center border-b border-[#c9a96e]/10 px-4 py-3 bg-[#130e08]/50">
            <Search className="w-4 h-4 text-muted/40 mr-3" />
            <Command.Input 
              value={search}
              onValueChange={setSearch}
              placeholder="Search products, orders, or commands..." 
              className="flex-1 bg-transparent text-[#e8dcc8] text-sm outline-none placeholder:text-muted/50"
            />
            <button onClick={() => setOpen(false)} className="text-muted/40 hover:text-white p-1">
               <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto px-2 py-2">
            <Command.Empty className="py-12 text-center text-sm text-muted/40 bg-[#0d0a07]">
              No results found for "{search}"
            </Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => onSelectLink('/admin/dashboard')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 <LayoutDashboard className="w-4 h-4 text-[#c9a96e]/50" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => onSelectLink('/admin/products')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 <Package className="w-4 h-4 text-[#c9a96e]/50" /> Product Catalogue
              </Command.Item>
              <Command.Item onSelect={() => onSelectLink('/admin/orders')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 <ShoppingBag className="w-4 h-4 text-[#c9a96e]/50" /> Order History
              </Command.Item>
              <Command.Item onSelect={() => onSelectLink('/admin/audit')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 <ScrollText className="w-4 h-4 text-[#c9a96e]/50" /> Audit Log
              </Command.Item>
            </Command.Group>

            <div className="my-2 border-t border-[#c9a96e]/5 mx-2" />

            <Command.Group heading="Quick Actions">
              <Command.Item onSelect={() => onSelectLink('/admin/products/new')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 Add New Product <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
              </Command.Item>
              <Command.Item onSelect={() => alert('Exporting CSV...')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                 Export Orders CSV <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
              </Command.Item>
            </Command.Group>

            {/* Render products actively if we are searching */}
            {(debouncedSearch.length > 0 || (productResults?.data && productResults.data.length > 0)) && (
               <>
                 <div className="my-2 border-t border-[#c9a96e]/5 mx-2" />
                 <Command.Group heading="Products">
                   {/* Filter on client side specifically if our endpoint doesn't support ?q */}
                   {productResults?.data?.filter(p => p.title.toLowerCase().includes(debouncedSearch.toLowerCase())).map(p => (
                     <Command.Item key={p.id} onSelect={() => onSelectLink('/admin/products')} className="flex items-center gap-3 px-3 py-2 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer">
                        <span className="truncate">{p.title}</span>
                        <span className="ml-auto text-[10px] text-muted/40 font-mono hidden sm:inline-block">SKU: {p.sku}</span>
                     </Command.Item>
                   ))}
                   {(!productResults?.data || productResults.data.length === 0) && (
                     <div className="py-2 px-3 text-xs text-muted/50">Search returning no matches...</div>
                   )}
                 </Command.Group>
               </>
            )}

            {/* Static Orders Group */}
            {debouncedSearch.length > 0 && (
              <>
                <div className="my-2 border-t border-[#c9a96e]/5 mx-2" />
                <Command.Group heading="Orders">
                  <Command.Item onSelect={() => onSelectLink('/admin/orders')} className="flex items-center gap-3 px-3 py-2 text-sm text-[#e8dcc8] rounded hover:bg-[#c9a96e]/10 aria-selected:bg-[#c9a96e]/10 cursor-pointer text-sky-300/80">
                      Search for Order ID "{debouncedSearch}"...
                  </Command.Item>
                </Command.Group>
              </>
            )}

          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
