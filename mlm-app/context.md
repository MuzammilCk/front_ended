---
# Hadi Perfumes — Frontend Context

## Project Overview
- **App name:** mlm-app (AURORE luxury perfume storefront + MLM network)
- **Stack:** React 19, Vite 8, TypeScript 5.9, Tailwind CSS 3.4, React Router DOM 7
- **Backend:** hadi-perfumes-api (NestJS, PostgreSQL via TypeORM)
- **Backend base URL (dev):** http://localhost:3000 — configured via `VITE_API_BASE_URL`

## Folder Map
mlm-app/
src/
api/           ← HTTP client layer (added in Phase 1)
components/    ← All UI components — DO NOT touch during infra phases
admin-components/
Cart-components/
home-components/
Login-components/
profile-components/
Register-components/
wishlist-components/
data/          ← Static/mock data (adminStore.ts, products.ts, HomeData.ts)
pages/         ← Page components (Admin, Cart, Home, Login, Product, Profile, Register, Wishlist)
styles/        ← CSS files (Home.css, product.css)
context.md       ← This file
claude.md        ← Agent operating rules
diff.md          ← Change ledger
.env             ← Local env (gitignored)
.env.example     ← Env template (committed)

## Backend Domain → Frontend Route Mapping
| Backend domain    | Frontend route/page |
|-------------------|---------------------|
| /auth/*           | /login, /register   |
| /listings         | /product            |
| /categories       | /product (filters)  |
| /me/*             | /profile            |
| /orders, /payments| /cart               |
| /admin/*          | /admin              |

## Key Entities (Backend DTOs — exact field names)
- Auth: `phone`, `otp`, `refresh_token`, `access_token`
- Listing: `id`, `title`, `price`, `images`, `category_id`, `status`
- Order: `idempotency_key`, `items[]`, `discount_amount`, `total_amount`
- User: `id`, `phone`, `onboarding_status`

## Architecture Notes
- Auth uses OTP (phone-based), not email+password
- Access token stored in localStorage (`access_token`)
- Refresh token stored in localStorage (`refresh_token`)
- Token refresh endpoint: POST /auth/refresh with body `{ refresh_token }`
- All API calls go through `src/api/client.ts` — never fetch() directly in components

## Current Integration Status
- Phase 1: Foundation stabilized (build, configs, API client, error boundaries)
- Phase 2: Service modules complete — src/api/ has auth.ts, listings.ts, orders.ts,
payments.ts, network.ts, admin.ts, types.ts. All typed against backend DTOs.
- Phase 3: Screen integration complete.

Register.tsx: Full 3-step OTP signup flow
Login.tsx: Phone OTP send wired
Product.tsx: getListings() + getCategories() live
Profile.tsx: getOnboardingStatus() live
Cart.tsx: createOrder() + listOrders() live
Admin.tsx: getListings() + adminListOrders() live


- Phase 4: Auth hardening complete.

src/hooks/useAuth.ts: auth state hook (isLoggedIn, logout)
src/components/AuthGuard.tsx: synchronous route guard (localStorage check)
App.tsx: /profile, /cart, /admin now require auth; /product/:id route added
Sidebar.tsx: Sign Out button wired to apiLogout + clearTokens + navigate('/login')
Product.tsx: static families replaced with live getCategories()
ProductDetail.tsx: new page — /product/:id → getListingById()


- Phase 5+: Stripe checkout (createPaymentIntent → Stripe Elements → confirm),
Admin CRUD (adminCreateListing, adminUpdateListing, DeleteModal backend wire),
MLM network view (getDownline, getQualificationState in Profile),
Wishlist backend persistence (not yet started)
---
