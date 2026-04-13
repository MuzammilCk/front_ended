import {
  LayoutDashboard, Package, PlusCircle, Tag, ShoppingBag,
  Archive, Globe, Network, ScrollText, AlertTriangle, DollarSign, RotateCcw
} from 'lucide-react';
import { Link as RouterLink, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { getUserFirstName, getUserRole } from '../../api/client';

interface NavItem {
  key: string;
  icon: typeof LayoutDashboard;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview',    items: [{ key: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'    }] },
  { label: 'Catalogue',   items: [
    { key: 'products',   icon: Package,       label: 'Products'     },
    { key: 'products/new', icon: PlusCircle,  label: 'Add Product'  },
    { key: 'categories', icon: Tag,           label: 'Categories'   },
  ]},
  { label: 'Operations',  items: [
    { key: 'orders',     icon: ShoppingBag,   label: 'Orders'       },
    { key: 'inventory',  icon: Archive,       label: 'Inventory'    },
  ]},
  { label: 'Content',     items: [{ key: 'homepage', icon: Globe, label: 'Homepage CMS' }] },
  { label: 'Network',     items: [
    { key: 'network',    icon: Network,       label: 'MLM Network'  },
    { key: 'audit',      icon: ScrollText,    label: 'Audit Log'    },
  ]},
  { label: 'Trust & Safety', items: [
    { key: 'trust/disputes', icon: AlertTriangle, label: 'Disputes Desk' },
    { key: 'trust/returns',  icon: RotateCcw,     label: 'Returns'       },
  ]},
  { label: 'Finance', items: [
    { key: 'finance/payouts', icon: DollarSign, label: 'Payouts' },
  ]},
];

export default function Sidebar() {
  const name = getUserFirstName() ?? 'Admin';
  const role = getUserRole() ?? 'admin';

  // Fetch open disputes count
  const { data: disputesRes } = useQuery({
    queryKey: ['admin-open-disputes'],
    queryFn: () => apiRequest<{ total: number }>('/admin/disputes?status=open'),
    refetchInterval: 60000, // Re-fetch every minute for almost real-time updates
  });
  
  const openDisputesCount = disputesRes?.total || 0;

  return (
    <aside className="w-64 shrink-0 border-r border-[#c9a96e]/10 bg-[#0d0a07] z-20 flex flex-col relative">
      <div className="p-8 border-b border-[#c9a96e]/10">
        <h1 className="font-serif text-3xl font-light tracking-wide text-[#e8dcc8]">
          HADI
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted/40 mt-1">
          Admin Console
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-8 px-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted/20 mb-3 px-4">
              — {group.label} —
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.key}
                    to={`/admin/${item.key}`}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-4 py-3 border-l-2 transition-all duration-300 w-full text-left
                      ${isActive
                        ? 'border-[#c9a96e] bg-[#c9a96e]/5 text-[#e8dcc8]'
                        : 'border-transparent text-muted/30 hover:border-[#c9a96e]/30 hover:text-[#e8dcc8] hover:bg-white/[0.02]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#c9a96e]' : 'text-muted/30'}`} />
                        <span className="text-[11px] tracking-[0.2em] uppercase flex-1">
                          {item.label}
                        </span>
                        {item.key === 'trust/disputes' && openDisputesCount > 0 && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-1.5 min-w-[1.25rem] text-center rounded-full">
                            {openDisputesCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-[#c9a96e]/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#e8dcc8]">{name}</p>
            <span className="text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 mt-1 inline-block">
              {role}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted/30 pt-2 border-t border-white/5">
          <span>v2.0</span>
          <RouterLink to="/" className="hover:text-[#c9a96e] transition-colors">
            Storefront ↗
          </RouterLink>
        </div>
      </div>
    </aside>
  );
}
