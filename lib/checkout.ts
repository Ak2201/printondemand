import { z } from "zod";
import { designPathRe } from "@/lib/design-path";
import { getProduct } from "@/lib/products";

export const FREE_SHIPPING_ABOVE = 99900; // paise
export const FLAT_SHIPPING = 4900; // paise

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile number"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "6-digit pincode"),
});

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    color: z.string(),
    size: z.string().optional(),
    designPath: z.string().regex(designPathRe).optional(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(30),
  address: addressSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Recompute all prices on the server from the catalog; client prices are ignored. */
export function priceCart(items: CheckoutInput["items"]) {
  const lines = items.map((i) => {
    const p = getProduct(i.productId);
    if (!p) throw new Error(`Unknown product ${i.productId}`);
    if (!p.colors.some((c) => c.name === i.color)) throw new Error(`Invalid color for ${p.name}`);
    if (p.sizes && !(i.size && p.sizes.includes(i.size))) throw new Error(`Size required for ${p.name}`);
    return { ...i, unitPrice: p.price };
  });
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : FLAT_SHIPPING;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
