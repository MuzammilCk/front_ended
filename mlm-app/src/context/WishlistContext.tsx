import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  type: string;
  price: number;
  image: string;
  notes: string;
  inStock: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  count: number;
}

type WishlistAction =
  | { type: "HYDRATE"; payload: WishlistItem[] }
  | { type: "ADD_ITEM"; payload: WishlistItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR_WISHLIST" };

interface WishlistContextProps extends WishlistState {
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WISHLIST_KEY = "hadi_wishlist";

const initialState: WishlistState = {
  items: [],
  count: 0,
};

function calculateMetrics(items: WishlistItem[]) {
  return {
    count: items.length,
  };
}

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  let newItems: WishlistItem[];
  switch (action.type) {
    case "HYDRATE":
      newItems = action.payload;
      break;
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return state; // no-op if id already exists
      } else {
        newItems = [...state.items, action.payload];
      }
      break;
    }
    case "REMOVE_ITEM":
      newItems = state.items.filter((i) => i.id !== action.payload);
      break;
    case "CLEAR_WISHLIST":
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

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  // Initial load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dispatch({ type: "HYDRATE", payload: parsed as WishlistItem[] });
        } else {
          dispatch({ type: "HYDRATE", payload: [] });
        }
      }
    } catch {
      // JSON parse error, default to empty array
      dispatch({ type: "HYDRATE", payload: [] });
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    // Write only when items actually update. Array ref changes in reducer except when returning raw state.
    if (state.items !== initialState.items) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.items));
    }
  }, [state.items]);

  const addItem = (item: WishlistItem) => dispatch({ type: "ADD_ITEM", payload: item });
  const removeItem = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: id });
  const clearWishlist = () => dispatch({ type: "CLEAR_WISHLIST" });
  const isInWishlist = (id: string) => state.items.some((item) => item.id === id);

  return (
    <WishlistContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
