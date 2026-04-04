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

export const dailyOrders = [
  { day: "Mon", orders: 12, revenue: 5240 },
  { day: "Tue", orders: 19, revenue: 8830 },
  { day: "Wed", orders: 8, revenue: 3120 },
  { day: "Thu", orders: 24, revenue: 11400 },
  { day: "Fri", orders: 31, revenue: 14750 },
  { day: "Sat", orders: 42, revenue: 20100 },
  { day: "Sun", orders: 27, revenue: 12890 },
];

export const monthlyOrders = [
  { month: "Jan", orders: 210, revenue: 94500 },
  { month: "Feb", orders: 185, revenue: 82000 },
  { month: "Mar", orders: 260, revenue: 117000 },
  { month: "Apr", orders: 298, revenue: 134100 },
  { month: "May", orders: 340, revenue: 153000 },
  { month: "Jun", orders: 310, revenue: 139500 },
  { month: "Jul", orders: 275, revenue: 123750 },
  { month: "Aug", orders: 390, revenue: 175500 },
  { month: "Sep", orders: 420, revenue: 189000 },
  { month: "Oct", orders: 355, revenue: 159750 },
  { month: "Nov", orders: 480, revenue: 216000 },
  { month: "Dec", orders: 510, revenue: 229500 },
];

export const topProducts = [
  { name: "Oud Noir", sales: 214, revenue: 89880, pct: 92 },
  { name: "Rose Sauvage", sales: 178, revenue: 103240, pct: 77 },
  { name: "Ambre Brûlé", sales: 156, revenue: 77220, pct: 67 },
  { name: "Iris Obscur", sales: 134, revenue: 85760, pct: 58 },
  { name: "Poivre Noir", sales: 112, revenue: 43680, pct: 48 },
];

export const recentOrders: OrderType[] = [
  {
    id: "#AUR-4821",
    customer: "Layla Al-Rashid",
    product: "Oud Noir",
    amount: 420,
    status: "Delivered",
    date: "Today, 09:14",
  },
  {
    id: "#AUR-4820",
    customer: "James Whitmore",
    product: "Rose Sauvage",
    amount: 580,
    status: "Shipped",
    date: "Today, 07:52",
  },
  {
    id: "#AUR-4819",
    customer: "Priya Nair",
    product: "Iris Obscur",
    amount: 640,
    status: "Processing",
    date: "Yesterday",
  },
  {
    id: "#AUR-4818",
    customer: "Antoine Dubois",
    product: "Sel de Mer",
    amount: 310,
    status: "Delivered",
    date: "Yesterday",
  },
  {
    id: "#AUR-4817",
    customer: "Sofia Marchetti",
    product: "Ambre Brûlé",
    amount: 495,
    status: "Cancelled",
    date: "26 Mar",
  },
];

export const initialProducts: ProductType[] = [
  {
    id: 1,
    name: "Oud Noir",
    type: "Eau de Parfum",
    family: "Woody",
    price: 420,
    stock: 48,
    active: true,
  },
  {
    id: 2,
    name: "Rose Sauvage",
    type: "Extrait de Parfum",
    family: "Floral",
    price: 580,
    stock: 22,
    active: true,
  },
  {
    id: 3,
    name: "Sel de Mer",
    type: "Eau de Cologne",
    family: "Fresh",
    price: 310,
    stock: 67,
    active: true,
  },
  {
    id: 4,
    name: "Ambre Brûlé",
    type: "Eau de Parfum",
    family: "Oriental",
    price: 495,
    stock: 15,
    active: true,
  },
  {
    id: 5,
    name: "Iris Obscur",
    type: "Extrait de Parfum",
    family: "Floral",
    price: 640,
    stock: 9,
    active: false,
  },
];

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

export const maxDaily = Math.max(...dailyOrders.map((d) => d.orders));
export const maxMonthly = Math.max(...monthlyOrders.map((m) => m.orders));
export const totalRevenue = monthlyOrders.reduce((s, m) => s + m.revenue, 0);
export const totalOrders = monthlyOrders.reduce((s, m) => s + m.orders, 0);

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
