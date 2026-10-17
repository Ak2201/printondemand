# PrintForge — Print on Demand platform

Next.js 14 (App Router) · TypeScript · Tailwind · Fabric.js · Zustand · Stripe

## Features
- `/customizer` — Fabric.js canvas: image upload, text, colors, scale/rotate, front/back/wrap views, hi-res (4x) PNG export
- `/pricing-calculator` — profit/unit, margin, monthly profit, ROI, break-even units
- `/shop` — catalog + persisted cart + Stripe Checkout
- `/dashboard` — sidebar layout with demo order overview
- `/api/checkout` — Stripe Checkout session (mock fallback without `STRIPE_SECRET_KEY`)
- `/api/orders` — builds a Printful/Printify-shaped order payload (mock without `POD_API_KEY`)
- `/api/webhooks` — Stripe webhook receiver (signature verified when `STRIPE_WEBHOOK_SECRET` set)

## Local development
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Environment variables
| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhooks` |
| `POD_PROVIDER` | `printful` (default) or `printify` |
| `POD_API_KEY` | Supplier API token |
| `NEXT_PUBLIC_SITE_URL` | Public URL used for Stripe redirects |

## Deploy to Vercel
1. Push to GitHub (`Ak2201/printondemand`).
2. In Vercel: **Add New → Project**, import the repo (framework auto-detected as Next.js).
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy. In Stripe, add a webhook endpoint `https://<your-domain>/api/webhooks` for `checkout.session.completed` and copy its secret to `STRIPE_WEBHOOK_SECRET`.

## Known gaps / next steps
- Cart prices are client-supplied; look them up server-side by `productId` before going live.
- `/api/orders` does not yet call the supplier API; designs must be uploaded to storage to get file URLs.
- No database/auth yet (dashboard data is demo); add Supabase/Prisma for persistence.
