import React, { createContext, useContext, useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { adminListOrders, adminGetListings } from '../api/admin';
import { adminGetCategories } from '../api/admin';
import type { Order, AdminProductType, Listing, ProductCategory } from '../api/types';
import { useAdminToast } from '../hooks/useAdminToast';
import { ToastContainer } from '../components/admin-components/ToastContainer';

interface AdminContextType {
  products: AdminProductType[];
  rawListings: Listing[];
  orders: Order[];
  ordersTotal: number;
  categories: ProductCategory[];
  loading: boolean;
  refreshListings: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  setProducts: React.Dispatch<React.SetStateAction<AdminProductType[]>>;
  addToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdminData() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  // Wrap with QueryClientProvider so children (and the fetcher itself) have access to React Query
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDataFetcher>{children}</AdminDataFetcher>
    </QueryClientProvider>
  );
}

function AdminDataFetcher({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<AdminProductType[]>([]);
  const { toasts, addToast, removeToast } = useAdminToast();

  const { 
    data: listingsData, 
    isLoading: listingsLoading,
    refetch: refreshListingsQuery
  } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const result = await adminGetListings({ limit: 100 });
      if (result.data) {
        setProducts(
          result.data.map((listing: Listing) => ({
            id: listing.id,
            name: listing.title,
            type: listing.category?.name ?? "Parfum",
            family: listing.category?.name ?? "General",
            price: parseFloat(listing.price),
            stock: listing.inventory_item?.available_qty ?? listing.quantity ?? 0,
            active: listing.status === "active",
          }))
        );
        return result.data;
      }
      return [];
    },
  });

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refreshOrdersQuery
  } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminListOrders({ limit: 10 }),
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminGetCategories()
  });

  const loading = listingsLoading || ordersLoading || categoriesLoading;

  const refreshListings = async () => {
    await refreshListingsQuery();
  };

  const refreshOrders = async () => {
    await refreshOrdersQuery();
  };

  return (
    <AdminContext.Provider
      value={{
        products,
        setProducts,
        rawListings: listingsData || [],
        orders: ordersData?.data || [],
        ordersTotal: ordersData?.total || 0,
        categories: categoriesData || [],
        loading,
        refreshListings,
        refreshOrders,
        addToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AdminContext.Provider>
  );
}
