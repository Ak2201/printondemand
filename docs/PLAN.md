# PrintForge — Build Plan (supplier research → launch)

Assumption: you are India-based and sell mainly to Indian customers, paying via Razorpay. If you also want international buyers, see "Open decisions".
Research basis: web searches of supplier and Razorpay pages. Supplier numbers are vendor-published marketing and must be verified with sample orders.

## 1. Supplier analysis

| Supplier | Fit | What we know | Unverified / to confirm |
|---|---|---|---|
| **Qikink** | Best first choice for India | In-house production; Shopify/WooCommerce integrations; claims 29,000+ pincodes, 350+ products, COD support | Public API docs not found; may need partner access. Ask support for API + per-unit prices |
| **Printrove** | Strong alternative, has an API | Help-centre says a REST API can add designs, create/confirm orders, list products; API key under Profile > API Key in Merchant Panel | Endpoint details/auth not found publicly; mid-range prices; slower in rural areas (third-party review) |
| **Printful** | Only if selling internationally | Mature API, order-status webhooks, ~120 req/min limit (secondary source) | Ships to India from mostly US facilities; reported 10–28 business days and ~$11.99 shipping for a tee (third-party blog) — too slow/expensive for Indian buyers |
| **Printify** | Same as Printful | Aggregates multiple print providers; costs are final at order time | No India rate data found |
| **Oowia** and local IndiaMART vendors | Backup | Oowia claims 3–4 day fulfilment | Claims come from a competitor's blog |

**Recommendation:** make the supplier layer pluggable (`lib/suppliers/{printrove,qikink,printful}.ts` behind one interface). Start with Printrove (API confirmed) and Qikink (pricing/COD), run sample orders from both, then pick a primary.

**Evaluation checklist for sample orders (order 1 tee + 1 hoodie + 1 mug from each):**
print quality, fabric, delivery days to 3 pincodes (metro, tier-2, rural), packaging/branding, returns/reprint policy, cost per unit, COD/RTO handling, API access and rate limits, minimum order, design file specs (DPI, format, print area).

## 2. Architecture

```
Browser (Next.js) ── customizer (Fabric.js) ── cart ── Razorpay Checkout
        │                                              │
   Next.js API routes ── Supabase (Postgres + Storage + Auth)
        │  /api/checkout   create Razorpay order (server-priced)
        │  /api/payments/verify   HMAC check
        │  /api/webhooks/razorpay  source of truth for payment state
        │  /api/webhooks/supplier  shipping/tracking updates
        └─ Supplier adapter ── Printrove / Qikink / Printful
```

**Data model (Supabase/Postgres):** `products`, `variants` (supplier SKU, base cost, price), `designs` (storage URL, JSON, view), `orders`, `order_items`, `payments` (razorpay_order_id, payment_id, status), `shipments` (tracking, carrier), `webhook_events` (unique event id for idempotency), `customers`/auth.

## 3. Razorpay integration (replaces the Stripe code)

1. Server: create Razorpay order via Orders API with amount in paise, computed from DB prices (never trust client prices). Store `razorpay_order_id` with a `pending` order.
2. Client: open Standard Checkout with the order id and publishable `key_id`.
3. On success callback, server verifies `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` equals the returned signature.
4. Webhook `/api/webhooks/razorpay`: read the raw body (`req.text()`), verify the `x-razorpay-signature` header with the webhook secret, dedupe by event id, then mark paid.
5. Only after the webhook/verification marks the order paid, create the supplier order. Ensure payments are captured (enable auto-capture) or they expire.
6. Fees (official-page figures to re-check): domestic ~2% + 18% GST on the fee (about 2.36% all-in); international cards ~3% + GST; EMI/Amex ~3%; settlement ~T+2 domestic. Feed the real fee into the pricing calculator (currently Stripe-style 2.9% + $0.30).
7. Razorpay needs KYC and business verification; start this early. Test fully in test mode first.

## 4. Roadmap

| Phase | Deliverable | Est. |
|---|---|---|
| A. Foundations | Supabase schema, auth, move catalog to DB, INR pricing (₹), GST fields | 1 wk |
| B. Suppliers | Sample orders, adapter interface, Printrove adapter, product/variant SKU mapping, mockups | 1–2 wk |
| C. Payments | Razorpay order/verify/webhook, replace Stripe, server-side pricing | 1 wk |
| D. Fulfilment | Design upload to Storage, auto-create supplier order after payment, tracking webhook, email/WhatsApp notifications | 1–2 wk |
| E. Storefront | Product pages, size/variant selection, address + pincode check, order history, search | 1–2 wk |
| F. Admin | Orders, margin per order, supplier cost sync, refunds, catalog management | 1–2 wk |
| G. Compliance and launch | Privacy/terms/refund/shipping policies (needed by Razorpay), GST invoices, Vercel deploy, domain, monitoring (Sentry), E2E tests | 1 wk |

## 5. Business and legal checklist (India)
- Business entity/proprietorship, PAN, bank account for Razorpay KYC
- GST registration if turnover requires it; GST invoice per order
- Website must show: contact details, refund/cancellation, shipping, privacy policy, terms
- Decide COD (higher RTO risk) vs prepaid-only
- Content/IP policy for user uploads (copyrighted/trademarked designs)

## 6. Risks
- Supplier API access may need approval; keep adapter swappable
- Print quality/mockup mismatch → order samples, show print-area guides (already in customizer)
- Client-side price tampering → server-priced orders (Phase C)
- Duplicate fulfilment on webhook retries → idempotency table
- Image upload abuse → size/type limits, virus scan or storage rules

## 7. Open decisions (need your answer)
1. India-only, or also international buyers? (changes supplier and Razorpay international settings)
2. Do you want a marketplace of creators, or only your own store?
3. COD yes or no?
4. Supabase vs Prisma + own Postgres?
5. Brand name/domain (currently placeholder "PrintForge")
