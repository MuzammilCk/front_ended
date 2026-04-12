// src/api/types.ts
// Shared response type definitions matching hadi-perfumes-api entity shapes.
// Field names must match backend exactly — do not rename.

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  status: string;
}

export interface MeProfile {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  status: string;
  kyc_status: string;
  sponsor_id: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
}

export interface SignupResponse extends AuthTokens {
  user: AuthUser;
}

export interface OtpVerifyResponse {
  verified: boolean;
  session_token: string;
}

export interface OnboardingStatus {
  user_id: string;
  status: string;
  kyc_status: string;
  onboarding_completed_at: string | null;
}

// ─── Listings ────────────────────────────────────────────────────────────────

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_key: string;
  sort_order: number;
  deleted_at: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
}

export interface Listing {
  id: string;
  title: string;
  sku: string;
  description: string | null;
  price: string; // NUMERIC from DB comes as string
  category_id: string | null;
  seller_id: string;
  status: string;
  condition: string | null;
  authenticity_status: string | null;
  images: ListingImage[];
  category: ProductCategory | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedListings {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryReservation {
  id: string;
  listing_id: string;
  inventory_item_id: string;
  order_id: string | null;
  reserved_by_user_id: string;
  qty: number;
  expires_at: string;
  status: string;
  reservation_ttl_seconds: number;
  created_at: string;
  updated_at: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  listing_id: string;
  inventory_reservation_id: string | null;
  title: string;
  sku: string;
  unit_price: string; // NUMERIC from DB comes as string
  qty: number;
  line_total: string; // NUMERIC from DB comes as string
  currency: string;
  created_at: string;
}

export interface Order {
  id: string;
  idempotency_key: string;
  checkout_session_id: string | null;
  buyer_id: string;
  status: string;
  subtotal: string;
  shipping_fee: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  platform_revenue: string;
  shipping_address: string | null;
  billing_address: string | null;
  contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// ─── Network ─────────────────────────────────────────────────────────────────

export interface NetworkNode {
  user_id: string;
  sponsor_id: string | null;
  upline_path: string[] | string;
  depth: number;
  direct_count: number;
  total_downline: number;
}

export interface QualificationState {
  user_id: string;
  is_active: boolean;
  is_qualified: boolean;
  personal_volume: string;
  downline_volume: string;
  active_legs_count: number;
  policy_version_id: string | null;
  evaluated_at: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface GraphCorrectionLog {
  id: string;
  user_id: string;
  correction_type: string;
  old_sponsor_id: string | null;
  new_sponsor_id: string;
  reason: string;
  actor_id: string | null;
  created_at: string;
}

// ─── Admin UI Types (migrated from src/data/adminStore.ts) ───────────────────

export interface AdminProductType {
  id: string;
  name: string;
  type: string;
  family: string;
  price: number;
  stock: number;
  active: boolean;
}

export type AdminTabType =
  | 'dashboard' | 'products' | 'add' | 'orders' | 'audit'
  | 'categories' | 'inventory' | 'homepage' | 'network';

export const ORDER_STATUS_CLS: Record<string, string> = {
  Delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Shipped: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Processing: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  Cancelled: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

// ─── Homepage API ────────────────────────────────────────────────────────────

export interface HomepageHero {
  headline: string;
  subheadline: string;
  eyebrow: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  notes: string;
}

export interface HomepageFeaturedItem {
  id: string;
  name: string;
  family: string;
  type: string;
  notes: string;
  price: number;
  ml: string;
  badge: string | null;
  image_url: string;
  intensity: number;
}

export interface HomepageScentFamily {
  family: string;
  count: string;
  description: string;
  key_notes: string[];
  accent: string;
}

export interface HomepageTestimonial {
  text: string;
  author: string;
  location: string;
  fragrance: string;
  rating: number;
}

export interface HomepageBrandStatement {
  headline: string;
  body: string;
  stats: { value: string; label: string }[];
  image_url: string;
}

export interface HomepageContent {
  hero: HomepageHero;
  featured_collection: HomepageFeaturedItem[];
  brand_statement: HomepageBrandStatement;
  testimonials: HomepageTestimonial[];
  scent_families: HomepageScentFamily[];
  families: string[];
}

// ─── Media API ───────────────────────────────────────────────────────────────

export interface SignedUploadResponse {
  upload_url: string;
  storage_key: string;
  media_id: string;
}

export interface MediaAsset {
  id: string;
  cdn_url: string;
  storage_key: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
}

// ─── Cart API ────────────────────────────────────────────────────────────────

export interface CartApiItem {
  id: string;
  sku_id: string;
  listing_id: string;
  title: string;
  price: string;
  qty: number;
  image_url: string;
  notes: string;
  in_stock: boolean;
  expires_at: string | null;
}

export interface CartResponse {
  items: CartApiItem[];
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, { before: unknown; after: unknown }>;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  total_revenue: number;
  total_orders: number;
  active_products: number;
  total_products: number;
  avg_order_value: number;
}

