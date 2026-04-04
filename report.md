# Frontend ↔ Backend Compatibility Report

**Date:** 2026-04-04  
**Frontend:** `mlm-app` (React + Vite + TypeScript) — `src/api/*`, pages, Phase 4 guards  
**Backend:** Snapshot in `hadi.txt` (NestJS app under `muzammilck-hadi/hadi-perfumes-api/`)

---

## 1. Methodology

1. **Backend context first** — Read `hadi.txt` sections for root `context.md`, `claude.md`, and the embedded tree (single-vendor catalog, OTP auth, orders/payments phases, compliance focus).
2. **Authoritative API surface** — Extracted routes and DTOs from embedded files: `main.ts`, `auth.controller.ts`, `me.controller.ts`, `listing.controller.ts`, `category.controller.ts`, `order.controller.ts`, `payment.controller.ts`, `inventory.controller.ts`, `network.controller.ts`, `admin-listing.controller.ts`, `admin.guard.ts`, and selected DTOs (`create-order.dto.ts`, `reserve-stock.dto.ts`, `reorder-images.dto.ts`, `listing-search.dto.ts`, `get-downline.dto.ts`).
3. **Frontend contract** — Compared against `mlm-app/src/api/client.ts`, `auth.ts`, `listings.ts`, `orders.ts`, `payments.ts`, `network.ts`, `admin.ts`, `types.ts`, and representative usage (`Register.tsx`, `Cart.tsx`).

This report is **static contract analysis**, not a live integration test against a running API.

---

## 2. Executive summary

| Area | Status | Notes |
|------|--------|--------|
| **Global config** | ⚠️ Action required | `CORS_ORIGIN` defaults to `http://localhost:3001`; Vite is typically `5173`/`5174`. |
| **Auth: OTP send / verify / refresh / logout** | ✅ Largely aligned | Paths and JSON bodies match (`phone`, `otp`, `refresh_token`). |
| **Auth: signup POST body** | 🔴 **Blocking** | Backend `SignupDto` + `forbidNonWhitelisted` rejects extra fields; frontend sends `phone` and `attempt_id`. |
| **Me: onboarding status** | ✅ Aligned | `GET /me/onboarding-status` matches frontend. |
| **Listings & categories (public)** | ✅ Aligned | `GET /listings`, `GET /listings/:id`, `GET /categories` match. |
| **Listing search query params** | ✅ Aligned | `q`, `category_id`, `page`, `limit`, etc. match `ListingSearchDto`. |
| **Orders: create + list + get** | 🔴 **High** | **CreateOrderDto** expects nested `shipping_address` + `contact` objects; frontend sends plain strings. **Idempotency** header name differs (see below). |
| **Orders: cancel** | 🔴 **High** | Backend `POST /orders/:id/cancel`; frontend `DELETE /orders/:id`. |
| **Payments: create intent** | 🔴 **High** | Backend `POST /payments/intent` with `{ order_id, idempotency_key }`; frontend `POST /orders/:orderId/payment-intent` with different body. |
| **Inventory: reserve** | 🔴 **High** | DTO field `listingId` matches frontend **but** controller uses `req.user.userId` while JWT payload uses `sub` — likely broken on backend for authenticated inventory. |
| **Network API** | 🔴 **High** | Paths and response shapes differ from `mlm-app/src/api/network.ts` and `types.ts`. |
| **Admin `x-admin-token`** | ✅ Aligned | Matches `AdminGuard`; align env names (`ADMIN_TOKEN` vs `VITE_ADMIN_TOKEN`). |
| **Admin reorder images body** | 🔴 **Medium** | Backend expects `orderedIds` (camelCase); frontend sends `ordered_ids`. |
| **Media URLs (`storage_key`)** | ⚠️ Risk | If API returns S3 keys without a public base URL, `<img src={storage_key}>` may not render until a CDN/base URL strategy exists. |

---

## 3. Backend mental model (from `context.md` in `hadi.txt`)

- **Single-vendor catalog** (admin/company-owned), not a P2P marketplace.
- **Phases:** Commission/rules, identity/OTP/referral, network graph, catalog/inventory, then checkout/orders/payments (Stripe), ledger/payouts, etc.
- **Stated incomplete work:** `context.md` marks later phases (e.g. full checkout/Stripe lifecycle, returns, observability) as future; the export also includes `ts_errors.txt` / test artifacts — treat runtime behavior as “verify in deployment.”

---

## 4. Compatible integrations (detail)

### 4.1 HTTP client & auth transport

- **Base URL:** Frontend `VITE_API_BASE_URL` (default `http://localhost:3000`) matches backend `PORT` default in `main.ts`.
- **Bearer access token:** `Authorization: Bearer <access_token>` matches `JwtAuthGuard` verification.
- **Refresh / logout body:** `{ refresh_token }` matches `RefreshTokenDto`.

### 4.2 OTP flow (shape)

- `POST /auth/otp/send` with `{ phone }` (E.164) — matches `SendOtpDto`.
- `POST /auth/otp/verify` with `{ phone, otp }` — matches `VerifyOtpDto`.
- Response `{ verified, session_token }` — matches `SignupFlowService.verifyOtp` return and frontend `OtpVerifyResponse` usage.

### 4.3 Public catalog

- `GET /listings` with query params from `ListingSearchDto` — matches `getListings()` in `listings.ts`.
- `GET /listings/:id` — matches `getListingById()`.
- `GET /categories` and `GET /categories/:id` — matches `getCategories()` / `getCategoryById()`.

### 4.4 Admin static token

- Backend: `x-admin-token` must equal `process.env.ADMIN_TOKEN`.
- Frontend: sends `x-admin-token` from `VITE_ADMIN_TOKEN` — **operationally compatible** if values are kept equal across env files.

### 4.5 Order list shape (when authenticated)

- Backend `listOrders` returns a paginated structure consistent with frontend `PaginatedOrders` (`data`, `total`, `page`, `limit`) — **compatible** for `listOrders()` as wired in Cart.

---

## 5. Incompatibilities & risks (prioritized)

### P0 — Will fail validation or wrong route

1. **`POST /auth/signup` body (whitelist)**  
   - **Backend:** `ValidationPipe` with `forbidNonWhitelisted: true`; `SignupDto` fields: `full_name`, `password`, `referral_code` only (phone comes from session JWT).  
   - **Frontend:** `signup()` JSON includes `phone`, `full_name`, `password`, `referral_code`, `attempt_id`.  
   - **Effect:** 400 Bad Request (“property phone should not exist” / similar) unless the request body is trimmed to only allowed DTO fields.

2. **`POST /orders` body vs `CreateOrderDto`**  
   - **Backend:** Nested `shipping_address: AddressDto` (`line1`, `city`, `state`, `postal_code`, `country`, …) and `contact: ContactDto` (`name`, `phone`, optional `email`).  
   - **Frontend:** `CreateOrderPayload` uses `shipping_address: string` and `contact: string`.  
   - **Effect:** Validation failure; orders cannot be created as currently implemented.

3. **Order cancel**  
   - **Backend:** `POST /orders/:id/cancel`.  
   - **Frontend:** `DELETE /orders/${orderId}`.  
   - **Effect:** 404 or wrong method.

4. **Payment intent**  
   - **Backend:** `POST /payments/intent` with `{ order_id, idempotency_key }`, guarded by `JwtAuthGuard`.  
   - **Frontend:** `POST /orders/${orderId}/payment-intent` with body `{ idempotency_key }` only.  
   - **Effect:** Route/body mismatch; Phase 5 Stripe work must reconcile.

### P1 — Likely broken or misleading when used

5. **Idempotency header casing**  
   - **Backend:** `@Headers('idempotency-key')` (lowercase).  
   - **Frontend:** `'Idempotency-Key'`.  
   - **Note:** HTTP headers are case-insensitive per RFC; this is **usually fine**, but worth a quick runtime check in the target browser/server stack.

6. **Inventory `reserve` user id**  
   - **Backend:** `InventoryController` passes `req.user.userId` into the service.  
   - **JWT:** Standard payload in auth flow uses `sub` (also used in `OrderController` as `req.user.sub`).  
   - **Effect:** If `userId` is undefined, reservations may fail or attribute incorrectly — **treat as backend bug** to align with `sub`.

7. **Network module (entire `src/api/network.ts`)**  
   - **Upline:** Backend `GET /network/upline` returns an **object** (`userId`, `depth`, `sponsorId`, `uplinePath`); frontend `getUplinePath()` types and expects **`string[]`**.  
   - **Downline:** Backend returns **`{ data, total, page, limit }`** with items shaped like `{ userId, depth, sponsorId, directCount }`; frontend expects **`NetworkNode[]`** with snake_case fields (`user_id`, etc.).  
   - **Qualification:** Backend exposes `GET /network/qualification-status`; frontend calls **`GET /network/qualification`** with a different `QualificationState` shape.  
   - **Effect:** Any UI wired to these functions will not type-parse or match runtime JSON without adapter layer + path updates.

8. **Admin image reorder**  
   - **Backend:** `ReorderImagesDto` property **`orderedIds`**.  
   - **Frontend:** `ReorderImagesPayload` uses **`ordered_ids`**.  
   - **Effect:** 400 if whitelist rejects unknown properties or body fails validation.

### P2 — Configuration & product gaps

9. **CORS**  
   - **Backend:** `origin: process.env.CORS_ORIGIN || 'http://localhost:3001'`, `credentials: true`.  
   - **Frontend dev:** Vite on `http://localhost:5173` (or `5174`).  
   - **Action:** Set `CORS_ORIGIN` to the actual dev origin(s) or a comma-separated policy if the stack supports it.

10. **Listing images**  
    - If `storage_key` is not a full URL, the storefront must prepend a CDN/base URL (env-driven) or use signed URLs — not visible as a conflict in DTOs but affects **LCP** and “broken images.”

11. **Login for existing users**  
    - Documented on both sides: OTP signup exists; **no password login endpoint** for returning users — product expectation must stay “OTP or future endpoint.”

---

## 6. JWT payload consistency (backend)

- **Order & network controllers** use `req.user.sub`.  
- **Inventory controller** uses `req.user.userId`.  
Recommend standardizing on **`sub`** everywhere JWT user id is read.

---

## 7. Recommended next steps (minimal, ordered)

1. **Fix signup request body** in `mlm-app/src/api/auth.ts` (and any caller): POST only `{ full_name, password, referral_code }`; keep session in `Authorization: Bearer <session_token>`.  
2. **Align `createOrder`** with `CreateOrderDto`: build nested `shipping_address` and `contact` from the cart/checkout UI (or add a backend “simplified checkout” DTO — product decision).  
3. **Fix `cancelOrder`** path/method to `POST /orders/:id/cancel`.  
4. **Fix `createPaymentIntent`** to `POST /payments/intent` with `{ order_id, idempotency_key }`.  
5. **Inventory controller:** use `req.user.sub` (or map `sub` → user id) and verify E2E reserve flow.  
6. **Network module:** update paths (`qualification-status`), response wrappers, and DTO mapping; or add a thin adapter in `network.ts`.  
7. **Admin reorder:** send `{ orderedIds: [...] }` or configure global snake→camel transform to match backend DTOs.  
8. **Ops:** Set `CORS_ORIGIN`, `ADMIN_TOKEN` / `VITE_ADMIN_TOKEN`, and document image URL building for `storage_key`.

---

## 8. Conclusion

The **public catalog and OTP/token endpoints** are largely **contract-compatible** with `mlm-app`. The **highest-risk gaps** are **`/auth/signup` body whitelist**, **`POST /orders` DTO shape**, **order cancel route**, **payment intent route/body**, **network API paths/shapes**, and a probable **inventory JWT user id bug** on the backend. Resolving those (plus CORS and media URL strategy) is necessary before calling the stack “production-compatible” for checkout and MLM views.

---

*Generated from analysis of `hadi.txt` and `mlm-app/src/api` + selected pages. Re-run after backend or frontend contract changes.*
