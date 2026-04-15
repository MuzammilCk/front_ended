import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import type { CartApiItem } from '../api/types';
import type { ServerCartItem } from '../api/cart';
import {
  getServerCart,
  addServerCartItem,
  updateServerCartItem,
  removeServerCartItem,
  clearServerCart,
  mergeGuestCart,
  clearLocalCart,
  pruneStaleGuestItems,
} from '../api/cart';
import { AuthContext } from './AuthContext';
import {
  CART_STORAGE_KEY,
  GUEST_STORAGE_KEY,
  MAX_QTY_PER_ITEM,
} from '../constants/cart.constants';

// ─── Unified item shape exposed to consumers ────────────────────────────────

interface CartState {
  items: CartApiItem[];
  total: number;
  count: number;
  isAuthenticated: boolean;
}

type CartAction =
  | { type: 'HYDRATE'; payload: CartApiItem[] }
  | { type: 'ADD_ITEM'; payload: CartApiItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { id: string; qty: number } }
  | { type: 'CLEAR_CART' };

interface CartContextProps extends CartState {
  addItem: (item: CartApiItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  lastMutationError: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateMetrics(items: CartApiItem[]) {
  return {
    total: items.reduce(
      (sum, i) => sum + parseFloat(i.price || '0') * i.qty,
      0,
    ),
    count: items.reduce((sum, i) => sum + i.qty, 0),
  };
}

/** Convert a ServerCartItem (from API) to the CartApiItem shape used by all UI */
function serverItemToCartItem(s: ServerCartItem): CartApiItem {
  return {
    id: s.id,
    sku_id: s.listing_id,
    listing_id: s.listing_id,
    title: s.title,
    price: s.price,
    qty: s.qty,
    image_url: s.image_url,
    notes: '',
    in_stock: s.in_stock,
    available_qty: s.available_qty,
    expires_at: null,
  };
}

// ─── Guest cart reducer (localStorage mode) ──────────────────────────────────

const initialState: CartState = {
  items: [],
  total: 0,
  count: 0,
  isAuthenticated: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartApiItem[];
  switch (action.type) {
    case 'HYDRATE':
      newItems = action.payload;
      break;
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) =>
          i.sku_id === action.payload.sku_id ||
          i.listing_id === action.payload.listing_id,
      );
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === existing.id
            ? { ...i, qty: Math.min(i.qty + action.payload.qty, MAX_QTY_PER_ITEM) }
            : i,
        );
      } else {
        newItems = [
          ...state.items,
          { ...action.payload, qty: Math.min(action.payload.qty, MAX_QTY_PER_ITEM) },
        ];
      }
      break;
    }
    case 'REMOVE_ITEM':
      newItems = state.items.filter((i) => i.id !== action.payload);
      break;
    case 'UPDATE_QTY':
      newItems = state.items.map((i) =>
        i.id === action.payload.id
          ? { ...i, qty: Math.min(Math.max(action.payload.qty, 1), MAX_QTY_PER_ITEM) }
          : i,
      );
      break;
    case 'CLEAR_CART':
      newItems = [];
      break;
    default:
      return state;
  }

  return {
    ...state,
    items: newItems,
    ...calculateMetrics(newItems),
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authCtx = useContext(AuthContext);
  const isLoggedIn = !!authCtx?.user && authCtx.isLoggedIn;
  const [lastMutationError, setLastMutationError] = useState<string | null>(null);

  // Track previous auth state to detect login events
  const prevAuthRef = useRef(false);
  const hasMergedRef = useRef(false);

  // ─── Guest mode: useReducer + localStorage ──────────────────────────────

  const [guestState, dispatch] = useReducer(cartReducer, initialState);

  // Hydrate guest cart from localStorage on mount
  useEffect(() => {
    if (!isLoggedIn) {
      try {
        pruneStaleGuestItems();
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartApiItem[];
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      } catch {
        // Ignored — corrupt localStorage
      }
    }
  }, [isLoggedIn]);

  // Persist guest cart to localStorage
  // Fix A9: clear localStorage when cart is emptied, not just when items exist.
  // Without this, removing all items left stale data that reappeared on refresh.
  useEffect(() => {
    if (!isLoggedIn) {
      if (guestState.items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(guestState.items));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, [guestState.items, isLoggedIn]);

  // ─── Authenticated mode: React Query + server API ───────────────────────

  const {
    data: serverCart,
    isLoading: serverLoading,
  } = useQuery({
    queryKey: ['server-cart'],
    queryFn: async () => {
      const res = await getServerCart();
      return res.items;
    },
    enabled: isLoggedIn,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const addMutation = useMutation({
    mutationFn: (vars: { listing_id: string; qty: number }) =>
      addServerCartItem(vars.listing_id, vars.qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['server-cart'] }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { itemId: string; qty: number }) =>
      updateServerCartItem(vars.itemId, vars.qty),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['server-cart'] });
      const previousCart = queryClient.getQueryData<ServerCartItem[]>(['server-cart']);
      queryClient.setQueryData<ServerCartItem[]>(['server-cart'], (old) =>
        (old ?? []).map((item) =>
          item.id === vars.itemId ? { ...item, qty: vars.qty } : item,
        ),
      );
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(['server-cart'], context.previousCart);
      }
      setLastMutationError('Could not update quantity. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeServerCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['server-cart'] });
      const previousCart = queryClient.getQueryData<ServerCartItem[]>(['server-cart']);
      queryClient.setQueryData<ServerCartItem[]>(['server-cart'], (old) =>
        (old ?? []).filter((item) => item.id !== itemId),
      );
      return { previousCart };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(['server-cart'], context.previousCart);
      }
      setLastMutationError('Could not remove item. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearServerCart(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['server-cart'] }),
  });

  // ─── Login event: merge guest cart → server, then clear localStorage ────

  useEffect(() => {
    const wasLoggedOut = !prevAuthRef.current;
    prevAuthRef.current = isLoggedIn;

    if (isLoggedIn && wasLoggedOut && !hasMergedRef.current) {
      hasMergedRef.current = true;

      // Read any guest cart items from localStorage
      let guestItems: CartApiItem[] = [];
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          guestItems = JSON.parse(raw) as CartApiItem[];
        }
      } catch {
        // Ignored
      }

      if (guestItems.length > 0) {
        // Merge guest items into server cart
        mergeGuestCart(
          guestItems.map((i) => ({
            listing_id: i.listing_id,
            qty: i.qty,
          })),
        )
          .then(() => {
            clearLocalCart();
            localStorage.removeItem(GUEST_STORAGE_KEY);
            dispatch({ type: 'CLEAR_CART' });
            queryClient.invalidateQueries({ queryKey: ['server-cart'] });
          })
          .catch((err) => {
            console.error('Cart merge failed — guest items retained', err);
          });
      } else {
        // No guest items — just fetch server cart
        queryClient.invalidateQueries({ queryKey: ['server-cart'] });
      }
    }

    // Reset merge flag on logout
    if (!isLoggedIn) {
      hasMergedRef.current = false;
    }
  }, [isLoggedIn, queryClient]);

  // ─── Unified actions (route to guest or server) ─────────────────────────

  const addItem = useCallback(
    (item: CartApiItem) => {
      if (isLoggedIn) {
        addMutation.mutate({ listing_id: item.listing_id, qty: item.qty });
      } else {
        dispatch({ type: 'ADD_ITEM', payload: item });
      }
    },
    [isLoggedIn, addMutation],
  );

  const removeItem = useCallback(
    (id: string) => {
      if (isLoggedIn) {
        removeMutation.mutate(id);
      } else {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
      }
    },
    [isLoggedIn, removeMutation],
  );

  const updateQty = useCallback(
    (id: string, qty: number) => {
      if (qty < 1) {
        removeItem(id);
        return;
      }
      const clampedQty = Math.min(qty, MAX_QTY_PER_ITEM);
      if (isLoggedIn) {
        updateMutation.mutate({ itemId: id, qty: clampedQty });
      } else {
        dispatch({ type: 'UPDATE_QTY', payload: { id, qty: clampedQty } });
      }
    },
    [isLoggedIn, updateMutation, removeItem],
  );

  const clearCart = useCallback(() => {
    if (isLoggedIn) {
      clearMutation.mutate();
    } else {
      dispatch({ type: 'CLEAR_CART' });
      clearLocalCart();
    }
  }, [isLoggedIn, clearMutation]);

  // ─── Compute final state ────────────────────────────────────────────────

  const items: CartApiItem[] = isLoggedIn
    ? (serverCart ?? []).map(serverItemToCartItem)
    : guestState.items;

  const metrics = calculateMetrics(items);

  return (
    <CartContext.Provider
      value={{
        items,
        total: metrics.total,
        count: metrics.count,
        isAuthenticated: isLoggedIn,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        lastMutationError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
