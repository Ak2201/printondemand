import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { designPathRe, slugRe } from "@/lib/design-path";
import { DATA_DIR } from "@/lib/local-store";
import { getAdmin } from "@/lib/supabase/admin";

export const DESIGN_BUCKET = "designs";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // supplier has 7 days to download
export const PRINT_W = 2240;
export const PRINT_H = 2720;
export const MAX_DESIGN_BYTES = 25 * 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const newDesignPath = () => `${crypto.randomUUID()}.png`;
export const isPng = (b: Buffer) => b.length > 8 && b.subarray(0, 8).equals(PNG_MAGIC);

/** True when designs are stored on local disk (no Supabase, not production). */
export const localDesignsEnabled = () => !getAdmin() && process.env.NODE_ENV !== "production";

const designsDir = () => path.join(DATA_DIR, "designs");
export function localDesignFile(p: string) {
  if (!designPathRe.test(p)) throw new Error("Invalid design path");
  return path.join(designsDir(), p);
}

export async function saveLocalDesign(p: string, bytes: Buffer) {
  fs.mkdirSync(designsDir(), { recursive: true });
  const tmp = `${localDesignFile(p)}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, bytes);
  fs.renameSync(tmp, localDesignFile(p));
}

/** Signed upload slot so the browser sends the large PNG straight to storage (avoids serverless body limits). */
export async function createUploadSlot() {
  const db = getAdmin();
  if (!db) return null;
  const path = newDesignPath();
  const { data, error } = await db.storage.from(DESIGN_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token };
}

/** Does an uploaded design exist? Only checkable locally; Supabase uploads are trusted by path format. */
export function designExists(p: string): boolean {
  if (!localDesignsEnabled()) return true;
  return fs.existsSync(localDesignFile(p));
}

// ---- Ready-made catalog designs (public/designs/<slug>.svg) ----

const svgFile = (slug: string) => path.join(process.cwd(), "public", "designs", `${slug}.svg`);
export const catalogDesignExists = (slug: string) => slugRe.test(slug) && fs.existsSync(svgFile(slug));

async function loadSvg(slug: string): Promise<Buffer> {
  if (!slugRe.test(slug)) throw new Error(`Invalid design slug "${slug}"`);
  try { return fs.readFileSync(svgFile(slug)); } catch { /* fall through to HTTP (serverless may not bundle public/) */ }
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (base) {
    const res = await fetch(`${base.replace(/\/$/, "")}/designs/${slug}.svg`).catch(() => null);
    if (res?.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`Catalog design "${slug}" not found (expected public/designs/${slug}.svg)`);
}

/** Rasterise catalog SVG to a print-ready transparent 2240x2720 PNG. */
export async function rasterizeSvg(svg: Buffer): Promise<Buffer> {
  const meta = await sharp(svg, { density: 72 }).metadata();
  const w = meta.width ?? PRINT_W, h = meta.height ?? PRINT_H;
  const density = Math.min(2400, Math.max(72, 72 * Math.max(PRINT_W / w, PRINT_H / h)));
  return sharp(svg, { density })
    .resize(PRINT_W, PRINT_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
}

/** Deterministic uuid-shaped storage path for a rasterised catalog design (changes if the SVG changes). */
function slugPath(slug: string, svg: Buffer) {
  const h = crypto.createHash("sha256").update(slug).update(svg).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}.png`;
}

/** Rasterise a catalog design and store it like an uploaded one; returns its storage path. */
export async function materializeCatalogDesign(slug: string): Promise<string> {
  const svg = await loadSvg(slug);
  const p = slugPath(slug, svg);
  const db = getAdmin();
  if (db) {
    const { data } = await db.storage.from(DESIGN_BUCKET).createSignedUrl(p, 60);
    if (!data?.signedUrl) {
      const png = await rasterizeSvg(svg);
      const { error } = await db.storage.from(DESIGN_BUCKET).upload(p, png, { contentType: "image/png", upsert: true });
      if (error) throw error;
    }
  } else if (!fs.existsSync(localDesignFile(p))) {
    await saveLocalDesign(p, await rasterizeSvg(svg));
  }
  return p;
}

export interface DesignRef { designPath?: string; designSlug?: string }

export async function resolveDesignPath(ref: DesignRef): Promise<string | null> {
  if (ref.designPath) return ref.designPath;
  if (ref.designSlug) return materializeCatalogDesign(ref.designSlug);
  return null;
}

/** Print-ready PNG bytes for an order item. */
export async function getDesignBuffer(ref: DesignRef): Promise<Buffer> {
  const p = await resolveDesignPath(ref);
  if (!p) throw new Error("Item has no design");
  const db = getAdmin();
  if (!db) {
    const f = localDesignFile(p);
    if (!fs.existsSync(f)) throw new Error(`Design file ${p} not found in local storage`);
    return fs.readFileSync(f);
  }
  const { data, error } = await db.storage.from(DESIGN_BUCKET).download(p);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function getDesignUrl(ref: DesignRef | string | null | undefined): Promise<string | null> {
  const r: DesignRef = typeof ref === "string" ? { designPath: ref } : ref ?? {};
  const p = await resolveDesignPath(r);
  if (!p) return null;
  const db = getAdmin();
  if (!db) {
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${base}/api/designs/${p}`;
  }
  const { data, error } = await db.storage.from(DESIGN_BUCKET).createSignedUrl(p, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

/** Server-side check that every referenced design can be found (best effort; Supabase uploads are trusted by path). */
export function checkDesignsExist(items: DesignRef[]): string | null {
  for (const i of items) {
    if (i.designPath && !designExists(i.designPath)) return "Uploaded design not found; upload it before checkout";
    if (i.designSlug && localDesignsEnabled() && !catalogDesignExists(i.designSlug)) return `Unknown catalog design "${i.designSlug}"`;
  }
  return null;
}
