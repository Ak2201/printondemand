import type { CartItem } from "@/types";

export interface ShippingAddress {
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/** Build a payload shaped like Printful's POST /orders (Printify differs slightly). */
export function buildSupplierOrder(items: CartItem[], recipient: ShippingAddress, provider = "printful") {
  if (provider === "printify") {
    return {
      external_id: `pod-${Date.now()}`,
      line_items: items.map((i) => ({ product_id: i.productId, variant_id: 1, quantity: i.quantity })),
      shipping_method: 1,
      address_to: { first_name: recipient.name, address1: recipient.address1, city: recipient.city, region: recipient.state, zip: recipient.zip, country: recipient.country },
    };
  }
  return {
    external_id: `pod-${Date.now()}`,
    recipient: { name: recipient.name, address1: recipient.address1, city: recipient.city, state_code: recipient.state, zip: recipient.zip, country_code: recipient.country },
    items: items.map((i) => ({
      variant_id: 1,
      quantity: i.quantity,
      name: i.name,
      files: i.preview ? [{ type: "default", url: "(uploaded design URL)" }] : [],
    })),
  };
}
