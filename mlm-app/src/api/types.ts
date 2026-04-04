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

