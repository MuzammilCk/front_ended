import { getUserFirstName } from '../../api/client';
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface TopbarProps {
  pendingOrderCount?: number;
  onSearch?: (query: string) => void;
}

/** Maps the first segment after /admin/ to a human-readable title. */
const PATH_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  products:   'Product Catalogue',
  'products/new': 'Add New Perfume',
  orders:     'Order History',
  audit:      'Audit Log',
  categories: 'Categories',
  inventory:  'Inventory',
  homepage:   'Homepage CMS',
  network:    'MLM Network',
  'trust/disputes': 'Disputes',
  'trust/returns':  'Returns',
  'finance/payouts': 'Payouts',
};

function getTitleFromPath(pathname: string): string {
  // Strip /admin/ prefix to get the sub-path
  const sub = pathname.replace(/^\/admin\/?/, '');
  // Try exact match first (e.g. "products/new"), then first segment
  return PATH_TITLES[sub] ?? PATH_TITLES[sub.split('/')[0]] ?? 'Admin';
}

export default function Topbar({ pendingOrderCount = 0, onSearch }: TopbarProps) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const title = getTitleFromPath(pathname);
  const name = getUserFirstName() ?? 'Admin';

  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="sticky top-0 z-30 px-8 py-4 border-b border-[#c9a96e]/5 flex items-center justify-between bg-[#080604]/90 backdrop-blur-md">
      <div>
        <h1 className="font-serif text-2xl font-light text-[#e8dcc8]">
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e]">Admin</p>
          <span className="text-muted/20 text-[10px]">/</span>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted/40">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/30" />
          <input
            className="w-64 pl-9 pr-4 py-2 bg-[#130e08] border border-[#c9a96e]/15 text-[#e8dcc8] text-xs font-light outline-none focus:border-[#c9a96e]/50 transition-colors"
            placeholder="Global search..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6 border-l border-[#c9a96e]/10 pl-8">
          <button className="relative text-muted/60 hover:text-[#e8dcc8] transition-colors">
            <Bell className="w-5 h-5" />
            {pendingOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white border border-[#080604]">
                {pendingOrderCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#e8dcc8] tracking-wide">{name} ▾</span>
            <button 
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-widest text-muted/60 hover:text-[#c9a96e] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
