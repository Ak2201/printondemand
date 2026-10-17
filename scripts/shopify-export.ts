/**
 * Generates a Shopify product import kit from the catalog:
 *   shopify/products.csv        (import in Shopify admin > Products > Import)
 *   shopify/images/*.jpg        (product mockups, one per design/product/colour)
 *   shopify/print-files/*.png   (2240x2720 transparent print files, one per design)
 *
 * Needs the dev server running:  npm run dev   (mockups are screenshotted from /mockup-render)
 * Usage: npx tsx scripts/shopify-export.ts [imageBaseUrl]
 * imageBaseUrl must be publicly reachable when you import (default: raw GitHub URL of this repo — repo must be public,
 * or upload shopify/images to Shopify Files / any host and pass that base URL).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";
import { catalogDesigns } from "../lib/design-catalog";
import { products } from "../lib/products";

const BASE = (process.argv[2] ?? "https://raw.githubusercontent.com/Ak2201/printondemand/main/shopify/images").replace(/\/$/, "");
const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "shopify");
const grams: Record<string, number> = { tshirt: 200, hoodie: 550, mug: 400, phonecase: 60, canvas: 600 };
const typeName: Record<string, string> = { tshirt: "T-Shirts", hoodie: "Hoodies", mug: "Mugs", phonecase: "Phone Cases", canvas: "Canvas Prints" };

const csvCell = (v: string | number | boolean | undefined) => {
  const s = v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const COLS = ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published", "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price", "Variant Requires Shipping",
  "Variant Taxable", "Image Src", "Image Position", "Image Alt Text", "Variant Image", "Variant Weight Unit", "Cost per item", "Status"];
const row = (o: Record<string, string | number | boolean | undefined>) => COLS.map((c) => csvCell(o[c])).join(",");

async function main() {
  fs.mkdirSync(path.join(OUT, "images"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "print-files"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const lines = [COLS.join(",")];
  let shots = 0;

  for (const d of catalogDesigns) {
    // print file
    const svg = fs.readFileSync(path.join("public", "designs", `${d.slug}.svg`));
    const printOut = path.join(OUT, "print-files", `${d.slug}.png`);
    if (!fs.existsSync(printOut)) {
      await sharp(svg, { density: 300 }).resize(2240, 2720, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(printOut);
    }
    for (const pid of d.productIds) {
      const p = products.find((x) => x.id === pid)!;
      const handle = `${d.slug}-${pid}`;
      const title = `${d.name} ${p.name.replace("Classic ", "").replace("Pullover ", "").replace(" 11oz", "").replace(" 12x16", "")}`;
      const sizes = p.sizes ?? [];
      const single = p.colors.length === 1 && sizes.length === 0;
      const images: { file: string; alt: string; color: string }[] = [];
      for (const c of p.colors) {
        const file = `${handle}-${c.name.toLowerCase()}.jpg`;
        const out = path.join(OUT, "images", file);
        if (!fs.existsSync(out)) {
          const url = `${SITE}/mockup-render?product=${pid}&color=${c.hex.slice(1)}&view=${p.views[0]}&design=${encodeURIComponent(d.src)}`;
          await page.goto(url);
          await page.waitForSelector('#frame[data-ready="1"]');
          await page.waitForTimeout(80);
          await (await page.$("#frame"))!.screenshot({ path: out, type: "jpeg", quality: 82 });
          shots++;
        }
        images.push({ file, alt: `${title} in ${c.name}`, color: c.name });
      }
      const body = `<p>${d.tagline}. Printed on demand on a ${p.name.toLowerCase()} and delivered across India.</p><ul><li>Design: ${d.name}</li><li>Prices include GST</li></ul>`;
      const tags = [...d.tags, d.category, "ready-made", p.category].join(", ");
      const url = (f: string) => `${BASE}/${f}`;
      let first = true;
      for (const c of p.colors) {
        const img = images.find((i) => i.color === c.name)!;
        for (const s of sizes.length ? sizes : [undefined]) {
          const o: Record<string, string | number | boolean | undefined> = { Handle: handle };
          if (first) Object.assign(o, { Title: title, "Body (HTML)": body, Vendor: "PrintForge", Type: typeName[pid], Tags: tags, Published: true, Status: "draft" });
          Object.assign(o, single
            ? { "Option1 Name": "Title", "Option1 Value": "Default Title" }
            : { "Option1 Name": "Color", "Option1 Value": c.name, ...(s ? { "Option2 Name": "Size", "Option2 Value": s } : {}) });
          Object.assign(o, {
            "Variant SKU": `PF-${d.slug}-${pid}-${c.name}${s ? `-${s}` : ""}`.toUpperCase(), "Variant Grams": grams[pid], "Variant Inventory Policy": "continue",
            "Variant Fulfillment Service": "manual", "Variant Price": (p.price / 100).toFixed(2), "Variant Requires Shipping": true, "Variant Taxable": true,
            "Variant Weight Unit": "g", "Cost per item": ((p.baseCost + p.shipping) / 100).toFixed(2), "Variant Image": url(img.file),
          });
          if (first) Object.assign(o, { "Image Src": url(images[0].file), "Image Position": 1, "Image Alt Text": images[0].alt });
          lines.push(row(o));
          first = false;
        }
      }
      images.slice(1).forEach((img, i) => lines.push(row({ Handle: handle, "Image Src": url(img.file), "Image Position": i + 2, "Image Alt Text": img.alt })));
    }
  }
  fs.writeFileSync(path.join(OUT, "products.csv"), lines.join("\n") + "\n");
  await browser.close();
  console.log(`rows: ${lines.length - 1}, new mockups: ${shots}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
