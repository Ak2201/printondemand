import { printroveVariants, skuKey } from "./sku-map";
import type { SupplierAdapter, SupplierOrderInput, SupplierOrderResult } from "./types";

/**
 * Printrove adapter.
 *
 * UNVERIFIED: api.printrove.com was not reachable from the build environment, so only the facts
 * found in public search snippets are encoded (base path /api/external, bearer-token auth,
 * designs endpoint). The ORDER path and payload below are a best guess and MUST be checked
 * against https://api.printrove.com/docs/ before going live. Everything that depends on that
 * is isolated in `ENDPOINTS` and `buildPayload`.
 */
const BASE = process.env.PRINTROVE_BASE_URL ?? "https://api.printrove.com/api/external";
const ENDPOINTS = {
  orders: "/orders", // TODO(verify)
};

function buildPayload(input: SupplierOrderInput) {
  // TODO(verify): field names against the Printrove orders docs.
  return {
    reference_number: input.externalId,
    retail_price: 0,
    customer: {
      name: input.address.name,
      email: input.address.email,
      number: input.address.phone,
      address1: input.address.line1,
      address2: input.address.line2 ?? "",
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.pincode,
      country: "India",
    },
    cod: false, // prepaid only
    order_products: input.items.map((i) => {
      const v = printroveVariants[skuKey(i.productId, i.color, i.size)];
      if (!v) throw new Error(`No Printrove SKU mapped for ${skuKey(i.productId, i.color, i.size)}`);
      if (!i.designUrl) throw new Error(`Missing design for ${i.productId}`);
      return { product_id: v.productId, variant_id: v.variantId, quantity: i.quantity, design: { front: { url: i.designUrl } } };
    }),
  };
}

export const printrove: SupplierAdapter = {
  name: "printrove",
  async createOrder(input): Promise<SupplierOrderResult> {
    const key = process.env.PRINTROVE_API_KEY;
    if (!key) throw new Error("PRINTROVE_API_KEY not set");
    const res = await fetch(`${BASE}${ENDPOINTS.orders}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(buildPayload(input)),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Printrove ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
    // TODO(verify): response id field
    const id = body?.order?.id ?? body?.id;
    if (!id) throw new Error("Printrove response had no order id");
    return { supplierOrderId: String(id), status: String(body?.order?.status ?? "created") };
  },
};
