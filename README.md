# PrintForge — Print on Demand platform

Next.js 14 (App Router) · TypeScript · Tailwind · Fabric.js · Zustand · Supabase · Razorpay

## Run locally (no accounts needed)
```bash
npm install
npm run dev   # http://localhost:3000
```
Upload a photo in `/customizer`, add to cart, pay with the built-in mock payment, then open `/admin/orders` to download the print-ready PNG, packing slip and job file (also written to `.data/print-jobs/<order>/`). Set `ADMIN_TOKEN` to protect `/admin` (required in production; open it with `?token=…`).

## Features
- `/designs` — 16 ready-made designs; pick product/colour/size and buy as is, or send one to the customizer
- `/customizer` — live mockups (T-shirt, hoodie, mug, case, canvas); upload photos by click, drag & drop or paste; DPI warning; print-file download
- `/cart` — cart, delivery address, Razorpay payment; `/orders/<id>` confirmation
- `/admin/orders` — print files, retry fulfilment, mark shipped
- `/customizer` — Fabric.js canvas: image upload, text, colors, scale/rotate, front/back/wrap views, hi-res (4x) PNG export
- `/pricing-calculator` — profit/unit, margin, monthly profit, ROI, break-even units
- `/shop` — catalog + persisted cart + Razorpay Checkout (INR, prepaid only, GST-inclusive prices)
- `/dashboard` — sidebar layout with demo order overview
- `/api/checkout` — validates cart + address, prices server-side, creates a Razorpay order and pending order
- `/api/payments/verify` — HMAC check of the checkout signature, marks order paid
- `/api/webhooks/razorpay` — signed, idempotent webhook (`payment.captured`, `order.paid`)

## Local development
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Setup
1. Create a Supabase project and run `supabase/migrations/0001_init.sql` then `0002_fulfilment.sql` in the SQL editor (0002 also creates the private `designs` storage bucket).
2. Copy `.env.example` to `.env.local` and fill in the Supabase and Razorpay (test mode) keys.
3. Without Supabase keys orders are kept in memory; without Razorpay keys a mock payment is used. Both fallbacks are disabled in production for payments.

## Environment variables
See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are server-only — never prefix them with `NEXT_PUBLIC_`.

## Deploy to Vercel
1. Push to GitHub (`Ak2201/printondemand`).
2. In Vercel: **Add New → Project**, import the repo (framework auto-detected as Next.js).
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy. In Razorpay Dashboard > Webhooks add `https://<your-domain>/api/webhooks/razorpay` for `payment.captured` and `order.paid`, and set the secret as `RAZORPAY_WEBHOOK_SECRET`.

## Fulfilment (Phase B/D)
- Customizer exports a 2240×2720 PNG, uploads it straight to the private `designs` bucket via a server-signed URL, and the cart stores only its path. Without Supabase (local dev) no upload happens.
- After payment, `markPaid` → `lib/fulfilment.ts` sends the order to the supplier adapter (`lib/suppliers/`). Failures never break the payment webhook; they are recorded as a `failed` shipment for retry. A unique `(order_id, supplier)` constraint prevents duplicate supplier orders.
- `POD_PROVIDER=printrove` + `PRINTROVE_API_KEY` uses the Printrove adapter; in dev with no key a mock supplier is used; in production with no key orders stay `paid` for manual fulfilment.
- `/api/webhooks/printrove?token=…` updates tracking/status.

**Before going live with Printrove** (api.printrove.com was unreachable from the build environment, so these are unverified):
1. Check `ENDPOINTS` and `buildPayload` in `lib/suppliers/printrove.ts` against https://api.printrove.com/docs/ (order path, field names, response id).
2. Fill `lib/suppliers/sku-map.ts` with real Printrove product/variant ids, then update `lib/products.ts` costs from their price list.
3. Place real sample orders; check webhook payloads in logs and adjust `app/api/webhooks/printrove/route.ts`.
4. Currently one design (the current view) is sent per cart item; front+back printing is not yet supported.

## Known gaps / next steps
- Auth and order history (RLS policies exist; no login UI).
- GST invoices and policy pages (needed for Razorpay KYC).
- Real product mockups (currently emoji/colour placeholders) and a retry tool for failed shipments.
