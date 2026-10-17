import fs from "node:fs";
import path from "node:path";
import { getDesignBuffer } from "@/lib/designs";
import { DATA_DIR } from "@/lib/local-store";
import type { StoredOrder } from "@/lib/order-types";
import { getProduct } from "@/lib/products";

export const printJobDir = (orderId: string) => path.join(DATA_DIR, "print-jobs", orderId);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Local "printing": writes print-ready PNGs, job.json and a packing slip for an order. Idempotent. */
export async function writePrintJob(order: StoredOrder) {
  const dir = printJobDir(order.id);
  fs.mkdirSync(dir, { recursive: true });
  const items = [];
  for (const [n, l] of order.lines.entries()) {
    const file = `item-${n + 1}-${l.productId}-${l.color.toLowerCase()}${l.size ? `-${l.size}` : ""}.png`;
    fs.writeFileSync(path.join(dir, file), await getDesignBuffer(l));
    items.push({ product: getProduct(l.productId)?.name ?? l.productId, color: l.color, size: l.size, quantity: l.quantity, source: l.designSlug ? `ready-made:${l.designSlug}` : "customer-upload", printFile: file });
  }
  fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify({ orderId: order.id, createdAt: new Date().toISOString(), customer: order.address, items }, null, 2));
  const a = order.address;
  fs.writeFileSync(path.join(dir, "packing-slip.html"), `<!doctype html><meta charset="utf-8"><title>Packing slip ${order.id.slice(0, 8)}</title>
<body style="font-family:system-ui;max-width:640px;margin:2rem auto"><h1>Packing slip</h1><p>Order <b>${order.id}</b></p>
<h3>Ship to</h3><p>${esc(a.name)}<br>${esc(a.line1)}${a.line2 ? `<br>${esc(a.line2)}` : ""}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}<br>${esc(a.phone)}</p>
<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Item</th><th>Color</th><th>Size</th><th>Qty</th><th>Print file</th></tr>
${items.map((i) => `<tr><td>${esc(i.product)}</td><td>${esc(i.color)}</td><td>${esc(i.size ?? "-")}</td><td>${i.quantity}</td><td>${esc(i.printFile)}</td></tr>`).join("")}</table></body>`);
  return { dir, files: items.map((i) => i.printFile) };
}

export function listPrintFiles(orderId: string): string[] {
  try { return fs.readdirSync(printJobDir(orderId)).sort(); } catch { return []; }
}

export function printFilePath(orderId: string, name: string): string | null {
  if (!/^[\w.-]+$/.test(name) || !/^[0-9a-f-]{36}$/.test(orderId)) return null;
  const f = path.join(printJobDir(orderId), name);
  return fs.existsSync(f) ? f : null;
}
