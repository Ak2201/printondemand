import { getDesignUrl } from "@/lib/designs";
import { getAdmin } from "@/lib/supabase/admin";
import { getSupplier } from "@/lib/suppliers";
import type { SupplierOrderInput } from "@/lib/suppliers/types";
import type { Address } from "@/types";

export interface OrderSnapshot {
  id: string;
  address: Address;
  lines: { productId: string; color: string; size?: string; quantity: number; designPath?: string }[];
}

/**
 * Sends a paid order to the supplier. Never throws: a failure is recorded on the shipment row
 * (status "failed") so the payment webhook still returns 200 and ops can retry.
 */
export async function fulfilOrder(order: OrderSnapshot): Promise<void> {
  const supplier = getSupplier();
  if (!supplier) { console.warn(`[fulfilment] no supplier configured; order ${order.id} left as paid`); return; }
  const db = getAdmin();
  try {
    if (db) {
      const { data: existing } = await db.from("shipments").select("id,status").eq("order_id", order.id).eq("supplier", supplier.name).maybeSingle();
      if (existing && existing.status !== "failed") return; // already sent
    }
    const input: SupplierOrderInput = {
      externalId: order.id,
      address: order.address,
      items: await Promise.all(order.lines.map(async (l) => ({
        productId: l.productId, color: l.color, size: l.size, quantity: l.quantity, designUrl: await getDesignUrl(l.designPath),
      }))),
    };
    const res = await supplier.createOrder(input);
    console.info(`[fulfilment] order ${order.id} sent to ${supplier.name}: ${res.supplierOrderId}`);
    if (db) {
      await db.from("shipments").upsert({ order_id: order.id, supplier: supplier.name, supplier_order_id: res.supplierOrderId, status: res.status, updated_at: new Date().toISOString() }, { onConflict: "order_id,supplier" });
      await db.from("orders").update({ status: "in_production" }).eq("id", order.id);
    }
  } catch (err) {
    console.error(`[fulfilment] order ${order.id} failed`, err);
    if (db) await db.from("shipments").upsert({ order_id: order.id, supplier: supplier.name, status: "failed", updated_at: new Date().toISOString() }, { onConflict: "order_id,supplier" });
  }
}
