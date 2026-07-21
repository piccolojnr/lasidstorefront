# AGENTS.md

AI agent guidance for the Backthred Storefront project.

## Stack

- **Framework**: Astro 6 (SSR mode, `output: 'server'`)
- **UI**: Astro components for static markup, React islands for interactive UI only
- **Styling**: Tailwind CSS v4
- **Component library**: shadcn/ui — used only inside React islands (`.tsx` files)
- **State**: Nanostores (`nanostores`, `@nanostores/react`, `@nanostores/persistent`)
- **Language**: TypeScript throughout

## File naming

All files use **kebab-case**:

- `product-card.tsx`, `cart-drawer.tsx`, `address-form.tsx`
- `catalog.ts`, `cart-store.ts`, `session-store.ts`
- `magic-link.astro`, `order-detail.astro`

Astro dynamic route segments stay in brackets: `[slug].astro`, `[id].astro`.

## Project layout

```
src/
├── api/            # API client modules — one file per domain
├── stores/         # Nanostores atoms — cart, session
├── lib/            # Pure utilities: money formatting, CSRF, constants
├── middleware/     # Astro middleware: session guard, redirects
├── components/
│   ├── ui/         # Generic shadcn/Tailwind primitives (React)
│   ├── catalog/    # Product cards, grids, category nav (Astro)
│   ├── cart/       # Cart drawer, cart item, summary (React island)
│   ├── checkout/   # Address form, shipping selector, order summary (React)
│   ├── auth/       # Magic link form, password login form (React)
│   └── account/    # Order list, address list, profile form (React)
├── layouts/        # Astro layout shells
└── pages/          # File-based routing
    ├── products/
    ├── checkout/
    ├── auth/
    └── account/orders/
```

## API layer

- **All API calls go through `src/api/`** — no raw `fetch()` calls in components or pages.
- The base client lives in `src/api/client.ts`. It handles:
  - `X-Cart-Token` header injected from the cart token store
  - `Authorization: Bearer` header injected from the auth cookie
  - Response envelope unwrapping — functions return `data` directly or throw typed errors
- One file per domain: `catalog.ts`, `cart.ts`, `auth.ts`, `checkout.ts`, `payments.ts`, `addresses.ts`, `orders.ts`, `profile.ts`

## Money

- All monetary values from the API are in **minor units** (integer, pesewas).
- **Always** use `src/lib/money.ts` to format for display.
- Never divide or multiply money values manually outside of `money.ts`.
- Example: `1000` → `GHS 10.00`

## Cart token

- The guest cart token is persisted in `localStorage` under the key `cart_token` via `@nanostores/persistent`.
- Store: `src/stores/cart-store.ts` — `cartToken` atom.
- The API client reads `cartToken` and injects it as `X-Cart-Token` on every cart and checkout request.
- Do not read `localStorage` directly for the cart token anywhere else.

## Auth (JWT / Sanctum tokens)

- Authentication uses Laravel Sanctum personal access tokens (JWT-style, stateless).
- The token is stored in a cookie (`auth_token`) set by the backend or the `/auth/verify` page.
- The API client reads the cookie and injects `Authorization: Bearer` on every request.
- SSR pages extract the token from cookies and pass it to `createServerClient(authToken)`.
- The middleware (`src/middleware/index.ts`) checks for the `auth_token` cookie presence.

## Session / auth

- Server-rendered Astro pages check auth state via Astro middleware (`src/middleware/index.ts`) — checks `auth_token` cookie.
- Client-side React islands read from `src/stores/session-store.ts` (`sessionStore` atom), populated by calling `GET /api/v1/auth/session` on mount (uses the Bearer token).
- Protected pages (account, checkout) redirect to `/auth/login` when unauthenticated.
- Magic link is the primary auth flow. Password login is the fallback.
- `/auth/verify` page handles magic link callback — extracts token, sets cookie, redirects.

## React islands

- Add `client:load` only when the component must be interactive immediately (auth forms, cart drawer toggle).
- Prefer `client:visible` for below-the-fold interactive components (e.g. add-to-cart on product detail).
- Never add `client:*` to a component that has no interactive behaviour — keep it as an Astro component instead.
- shadcn components live in `src/components/ui/` and are only imported from `.tsx` files.

## Rendering

- `output: 'server'` — all pages are SSR by default.
- Use `export const prerender = true` on pages that are fully static and have no session dependency (e.g. catalog pages, product detail).
- Never mark checkout, account, or auth pages as prerendered.

## API base URL

Defined in `src/lib/constants.ts`:

```ts
export const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "/api/v1";
```

Set `PUBLIC_API_BASE` in `.env` for local development if the backend runs on a different origin.

## Error handling

- API errors surface as typed `ApiError` objects thrown by `src/api/client.ts`.
- `422` errors include a field-level `errors` map — forms should display these inline.
- `401` errors should trigger a redirect to `/auth/login`.

## Do not

- Do not call `fetch()` directly in components or pages.
- Do not format money values inline — always use `src/lib/money.ts`.
- Do not read or write `localStorage` directly for the cart token.
- Do not import shadcn components into `.astro` files.
- Do not add `client:load` to components that do not need interactivity.
- Do not depend on the coupon endpoints — they are placeholder stubs on the backend.

## UI Design Alignment

- Prefer simple, functional UI over decorative design.
- ProductCard is the most important reusable component — prioritize its correctness.
- Do not introduce new colors outside the defined palette.
- Avoid adding UI features not backed by API data.
- Mobile behavior must be considered for all interactive components.
