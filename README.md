# PrintForge — Print on Demand platform

Next.js 14 (App Router) · TypeScript · Tailwind · Fabric.js · Zustand · Supabase · Razorpay

## Features
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
1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the Supabase and Razorpay (test mode) keys.
3. Without Supabase keys orders are kept in memory; without Razorpay keys a mock payment is used. Both fallbacks are disabled in production for payments.

## Environment variables
See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are server-only — never prefix them with `NEXT_PUBLIC_`.

## Deploy to Vercel
1. Push to GitHub (`Ak2201/printondemand`).
2. In Vercel: **Add New → Project**, import the repo (framework auto-detected as Next.js).
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy. In Razorpay Dashboard > Webhooks add `https://<your-domain>/api/webhooks/razorpay` for `payment.captured` and `order.paid`, and set the secret as `RAZORPAY_WEBHOOK_SECRET`.

## Known gaps / next steps
- Phase B/D: supplier adapter and automatic supplier order after payment (`markPaid` in `lib/orders.ts` is the hook); design upload to Supabase Storage.
- Auth and order history (RLS policies are in the migration; no login UI yet).
- Catalog is in `lib/products.ts` mirroring the DB seed; costs are placeholders.
- GST invoices and policy pages (required for Razorpay KYC) are not built yet.
