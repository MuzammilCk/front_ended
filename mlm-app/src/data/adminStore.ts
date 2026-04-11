export interface ProductType {
  id: number;
  name: string;
  type: string;
  family: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface OrderType {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: string;
  date: string;
}

export const families = ["Woody", "Floral", "Fresh", "Oriental"];
export const perfTypes = [
  "Eau de Parfum",
  "Extrait de Parfum",
  "Eau de Toilette",
  "Eau de Cologne",
];
export const emptyForm = {
  name: "",
  type: "Eau de Parfum",
  family: "Woody",
  price: "",
  ml: "50",
  notes: "",
  badge: "",
  intensity: "70",
};

export const statusCls: Record<string, string> = {
  Delivered: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Shipped: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Processing: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  Cancelled: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

export const navItems = [
  { key: "dashboard", icon: "◈", label: "Dashboard" },
  { key: "products", icon: "◇", label: "Products" },
  { key: "add", icon: "+", label: "Add Perfume" },
  { key: "orders", icon: "≡", label: "Orders" },
] as const;

export type TabType = "dashboard" | "products" | "add" | "orders";
