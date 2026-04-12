# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm projects in a flat monorepo (no workspace config):

- [client/](client/) — React 19 + Vite 7 + Tailwind v4 frontend (deployed to Vercel as `molocart.vercel.app`).
- [server/](server/) — Express v5 + MongoDB (Mongoose) + Cloudinary API (deployed separately to Vercel).

Each side has its own `package.json`, `node_modules`, and `vercel.json`. Run commands from inside the relevant subdirectory.

## Common commands

Client (`cd client`):
- `npm run dev` — Vite dev server with HMR.
- `npm run build` — production build.
- `npm run lint` — ESLint (`eslint.config.js`, flat config, react-hooks + react-refresh rules).
- `npm run preview` — preview built bundle.

Server (`cd server`):
- `npm run server` — nodemon, reloads on change.
- `npm start` — plain `node server.js`.

No test runner is configured in either project.

## Required environment

Client (`client/.env`, Vite-exposed):
- `VITE_BACKEND_URL` — base URL for the API; set as `axios.defaults.baseURL` in [client/src/context/AppContext.jsx](client/src/context/AppContext.jsx).
- `VITE_CURRENCY` — display currency symbol.

Server (`server/.env`):
- `MONGODB_URI`, `JWT_SECRET`, `PORT`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SELLER_EMAIL`, `SELLER_PASSWORD` — hard-coded single-seller credentials (see auth section).
- `PAYSTACK_SECRET_KEY` — server-side Paystack secret.
- `NODE_ENV` — `production` triggers cross-site cookie flags (see auth section).

## Architecture

### API surface
All routes are mounted under `/api/*` in [server/server.js](server/server.js):
`/api/user`, `/api/seller`, `/api/product`, `/api/cart`, `/api/address`, `/api/order`. Note the route file for cart is [server/routes/cartRout.js](server/routes/cartRout.js) (typo preserved in import path).

CORS is locked to `http://localhost:5176` and `https://molocart.vercel.app` with `credentials: true`. Preflight is handled by `app.options(/.*/, cors())` — required because Express v5's path-to-regexp rejects the bare `"*"` string.

### Auth model — cookie-based JWT, two separate identities
- **User auth** ([server/middlewares/authUser.js](server/middlewares/authUser.js)): reads `token` cookie, verifies with `JWT_SECRET`, attaches `req.userId`. Controllers must read `req.userId`, **not** `req.user`.
- **Seller auth** ([server/middlewares/authSeller.js](server/middlewares/authSeller.js)): reads `sellerToken` cookie. The "seller" is a single shared account gated by `SELLER_EMAIL`/`SELLER_PASSWORD` env vars — there is no seller collection.
- Cookies are set with `sameSite: "none"`, `secure: true`, and `domain: ".vercel.app"` in production (see [server/controllers/userController.js](server/controllers/userController.js)). Any new auth-setting or clearing endpoint must mirror these flags or the cookie will not round-trip between `molocart.vercel.app` and the API subdomain.
- Frontend must send `axios.defaults.withCredentials = true` (set globally in [AppContext.jsx](client/src/context/AppContext.jsx)).

### Response shape convention
Controllers return `res.json({ success: true/false, ... })` and generally **do not** set non-200 status codes on failure — they return `success: false` with a message. Keep this shape when adding endpoints; the client checks `data.success` everywhere (e.g. `fetchProducts`, `fetchUser` in AppContext).

### State / data flow (client)
Single React context in [client/src/context/AppContext.jsx](client/src/context/AppContext.jsx) owns: `user`, `isSeller`, `products`, `cartItems`, `searchQuery`, and exposes the configured `axios` instance. All pages/components consume it via `useAppContext()`. On mount it calls `fetchUser`, `fetchSeller`, `fetchProducts`. `cartItems` is a `{ [productId]: quantity }` map that is persisted to the backend via a `useEffect` that POSTs `/api/cart/update` whenever it changes (but only when `user` is set).

Routing lives in [client/src/App.jsx](client/src/App.jsx). The `/seller/*` subtree swaps the layout: Navbar/Footer are hidden and `SellerLogin` renders in place of `SellerLayout` until `isSeller` is true. `ProtectedRoute` redirects unauthenticated users to `/` and pops the login modal via `setShowUserLogin`.

### Payments
Two flows in [server/controllers/orderController.js](server/controllers/orderController.js):
- **COD** (`placeOrderCOD`) — creates the order immediately with `isPaid: false`, `paymentType: "COD"`.
- **Paystack** (`placeOrderPaystack` + `verifyPaystackPayment`) — creates an unpaid order, calls `https://api.paystack.co/transaction/initialize` server-side using `PAYSTACK_SECRET_KEY`, returns `authorization_url` for the client to redirect. After redirect, the client hits `/api/order/verify-paystack` with the `reference`, which verifies via Paystack, marks the order `isPaid: true`, and clears `user.cartItems`. Amount is sent in kobo (`amount * 100`, NGN).
- Both flows add a flat 2% tax: `amount += Math.floor(amount * 0.02)`.
- `getUserOrders` / `getAllOrders` filter to `{ paymentType: "COD" } OR { isPaid: true }` so unpaid online orders are hidden.

### File uploads
Product images go through [server/configs/multer.js](server/configs/multer.js) → Cloudinary ([server/configs/cloudinary.js](server/configs/cloudinary.js)). The seller-only product create/update routes are the consumers.

### Deployment quirks
- Server [vercel.json](server/vercel.json) routes all paths to `server.js` with `@vercel/node`.
- Client [vercel.json](client/vercel.json) rewrites everything to `/` for SPA routing.
- Recent commit history is dominated by CORS + cookie-domain fixes for the Vercel cross-subdomain setup; treat those configs as load-bearing.
