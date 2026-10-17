# Shopify import kit

Generated from the catalog by `scripts/shopify-export.ts` (run `npm run dev`, then `npx tsx scripts/shopify-export.ts [imageBaseUrl]`).

| Path | What |
|---|---|
| `shopify/products.csv` | 76 products (16 designs × T-shirt / hoodie / mug / case / canvas where suitable), ~830 variant rows, all status **draft** |
| `shopify/images/` | 198 product mockups (JPG), one per design/product/colour |
| `shopify/print-files/` | 16 transparent 2240×2720 PNG print files, one per design (upload these to the supplier app) |

## Before importing
1. Shopify admin → Settings → General: store currency **INR**. Settings → Taxes: turn on **include tax in product prices** (prices in the CSV are GST-inclusive).
2. Image URLs in the CSV point to `https://raw.githubusercontent.com/Ak2201/printondemand/main/shopify/images/…` (works while the repo is public). If the repo is private, upload the images to Shopify → Content → Files (or any host) and re-run the script with that base URL as the first argument.
3. Costs (`Cost per item`) and vendor are placeholders; replace them after supplier sample orders.

## Import
Products → Import → upload `shopify/products.csv`. Products arrive as **draft**; review, then publish.

## Then connect fulfilment
CSV-imported products are not linked to the supplier. In the Printrove or Qikink Shopify app, map each product/variant to the supplier's blank product and attach the matching file from `shopify/print-files/` (or recreate the products from the supplier's side and use the CSV only for copy/prices). Place a sample order for each product type before publishing.

## Not covered by the CSV
Razorpay setup, shipping rates, policy pages (refund, shipping, privacy, terms), a "personalise your own" customizer app for photo uploads, and a theme.
