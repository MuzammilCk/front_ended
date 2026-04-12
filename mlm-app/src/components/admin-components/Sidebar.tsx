import { LayoutDashboard, Package, PlusCircle, Tag, ShoppingBag, Archive, Globe, Network, ScrollText } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { getUserFirstName, getUserRole } from '../../api/client';
import type { AdminTabType } from '../../api/types';

const NAV_GROUPS = [
  { label: 'Overview',    items: [{ key: 'dashboard'  as AdminTabType, icon: LayoutDashboard, label: 'Dashboard'    }] },
  { label: 'Catalogue',  items: [
    { key: 'products'   as AdminTabType, icon: Package,       label: 'Products'     },
    { key: 'add'        as AdminTabType, icon: PlusCircle,    label: 'Add Product'  },
    { key: 'categories' as AdminTabType, icon: Tag,           label: 'Categories'   },
  ]},
  { label: 'Operations', items: [
    { key: 'orders'     as AdminTabType, icon: ShoppingBag,   label: 'Orders'       },
    { key: 'inventory'  as AdminTabType, icon: Archive,       label: 'Inventory'    },
  ]},
  { label: 'Content',    items: [{ key: 'homepage'  as AdminTabType, icon: Globe,         label: 'Homepage CMS' }] },
  { label: 'Network',    items: [
    { key: 'network'    as AdminTabType, icon: Network,       label: 'MLM Network'  },
    { key: 'audit'      as AdminTabType, icon: ScrollText,    label: 'Audit Log'    },
  ]},
] as const;

interface SidebarProps {
  tab: AdminTabType;
  setTab: (tab: AdminTabType) => void;
}

export default function Sidebar({ tab, setTab }: SidebarProps) {
  const name = getUserFirstName() ?? 'Admin';
  const role = getUserRole() ?? 'admin';

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
                const isActive = tab === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`flex items-center gap-4 px-4 py-3 border-l-2 transition-all duration-300 w-full text-left
                      ${isActive 
                        ? "border-[#c9a96e] bg-[#c9a96e]/5 text-[#e8dcc8]" 
                        : "border-transparent text-muted/30 hover:border-[#c9a96e]/30 hover:text-[#e8dcc8] hover:bg-white/[0.02]"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#c9a96e]' : 'text-muted/30'}`} />
                    <span className="text-xs uppercase tracking-widest">{item.label}</span>
                  </button>
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
