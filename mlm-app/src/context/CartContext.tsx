import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import type { CartApiItem } from "../api/types";
import { AuthContext } from "./AuthContext";

// Re-use mapping from cart.ts logic for items
interface CartState {
  items: CartApiItem[];
  total: number;
  count: number;
  guestSession: boolean;
}

type CartAction =
  | { type: "HYDRATE"; payload: CartApiItem[] }
  | { type: "ADD_ITEM"; payload: CartApiItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QTY"; payload: { id: string; qty: number } }
  | { type: "CLEAR_CART" }
  | { type: "MERGE_CART"; payload: CartApiItem[] }
  | { type: "SET_GUEST_SESSION"; payload: boolean };

interface CartContextProps extends CartState {
  addItem: (item: CartApiItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  mergeCart: (items: CartApiItem[]) => void;
  setGuestSession: (isGuest: boolean) => void;
}

const CART_KEY = "hadi_cart";

const initialState: CartState = {
  items: [],
  total: 0,
  count: 0,
  guestSession: false,
};

function calculateMetrics(items: CartApiItem[]) {
  return {
    total: items.reduce((sum, i) => sum + parseFloat(i.price || "0") * i.qty, 0),
    count: items.reduce((sum, i) => sum + i.qty, 0),
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartApiItem[];
  switch (action.type) {
    case "HYDRATE":
      newItems = action.payload;
      break;
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.sku_id === action.payload.sku_id || i.listing_id === action.payload.listing_id
      );
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === existing.id ? { ...i, qty: i.qty + action.payload.qty } : i
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      break;
    }
    case "REMOVE_ITEM":
      newItems = state.items.filter((i) => i.id !== action.payload);
      break;
    case "UPDATE_QTY":
      newItems = state.items.map((i) =>
        i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
      );
      break;
    case "CLEAR_CART":
      newItems = [];
      break;
    case "MERGE_CART": {
      const mergedList = [...state.items];
      action.payload.forEach((incomingItem) => {
        const existingIndex = mergedList.findIndex(
          (i) => i.listing_id === incomingItem.listing_id
        );
        if (existingIndex > -1) {
          // Keep the higher qty
          const existingItem = mergedList[existingIndex];
          if (incomingItem.qty > existingItem.qty) {
            mergedList[existingIndex] = { ...existingItem, qty: incomingItem.qty };
          }
        } else {
          mergedList.push(incomingItem);
        }
      });
      newItems = mergedList;
      break;
    }
    case "SET_GUEST_SESSION":
      return { ...state, guestSession: action.payload };
    default:
      return state;
  }

  // Sync to localStorage immediately inside reducer conceptually, but better in useEffect
  return {
    ...state,
    items: newItems,
    ...calculateMetrics(newItems),
  };
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const authCtx = useContext(AuthContext);

  // Initial load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartApiItem[];
        dispatch({ type: "HYDRATE", payload: parsed });
      }
    } catch {
      // Ignored
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    // Write only when items actually update. Since HYDRATE happens once and doesn't change original
    if (state.items !== initialState.items) {
      localStorage.setItem(CART_KEY, JSON.stringify(state.items));
    }
  }, [state.items]);

  const addItem = (item: CartApiItem) => dispatch({ type: "ADD_ITEM", payload: item });
  const removeItem = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: id });
  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeItem(id);
    dispatch({ type: "UPDATE_QTY", payload: { id, qty } });
  };
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const mergeCart = (items: CartApiItem[]) => dispatch({ type: "MERGE_CART", payload: items });
  
  const setGuestSession = (isGuest: boolean) => {
    dispatch({ type: "SET_GUEST_SESSION", payload: isGuest });
    if (isGuest) {
      localStorage.setItem("hadi_guest", "true");
    } else {
      localStorage.removeItem("hadi_guest");
    }
  };

  // Restore guest session on load
  useEffect(() => {
    if (localStorage.getItem("hadi_guest") === "true") {
      dispatch({ type: "SET_GUEST_SESSION", payload: true });
    }
  }, []);

  // Watch for auth user login event
  useEffect(() => {
    if (authCtx?.user && state.items.length > 0) {
      // TODO: When backend cart sync is added, fetch server cart here and merge with local before dispatching
      mergeCart(state.items);
    }
    // We only want this to run when the user changes (login event), intentional exhaustive-deps disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx?.user]); 

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        mergeCart,
        setGuestSession,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
