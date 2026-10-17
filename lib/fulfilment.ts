import { getDesignUrl } from "@/lib/designs";
import { localTx } from "@/lib/local-store";
import type { StoredOrder } from "@/lib/order-types";
import { writePrintJob } from "@/lib/printjob";
import { getAdmin } from "@/lib/supabase/admin";
import { getSupplier } from "@/lib/suppliers";
import type { SupplierOrderInput } from "@/lib/suppliers/types";

/**
 * Sends a paid order to the supplier. Never throws: a failure is recorded on the shipment
 * (status "failed") so the payment webhook still returns 200 and ops can retry from /admin/orders.
 * Locally (no Supabase) the order also produces a print job on disk (.data/print-jobs/<id>).
 */
export async function fulfilOrder(order: StoredOrder): Promise<void> {
  const supplier = getSupplier();
  if (!supplier) { console.warn(`[fulfilment] no supplier configured; order ${order.id} left as paid`); return; }
  const db = getAdmin();
  const record = async (s: { status: string; supplierOrderId?: string; error?: string }, orderStatus?: string) => {
    const now = new Date().toISOString();
    if (db) {
      await db.from("shipments").upsert({ order_id: order.id, supplier: supplier.name, supplier_order_id: s.supplierOrderId, status: s.status, updated_at: now }, { onConflict: "order_id,supplier" });
      if (orderStatus) await db.from("orders").update({ status: orderStatus }).eq("id", order.id);
    } else {
      await localTx((d) => {
        const o = d.orders[order.id]; if (!o) return;
        o.shipment = { supplier: supplier.name, supplierOrderId: s.supplierOrderId, status: s.status, error: s.error, updatedAt: now };
        if (orderStatus) o.status = orderStatus;
      });
    }
  };
  try {
    if (order.shipment && order.shipment.status !== "failed" && order.shipment.supplier === supplier.name) return; // already sent
    if (db) {
      const { data: existing } = await db.from("shipments").select("status").eq("order_id", order.id).eq("supplier", supplier.name).maybeSingle();
      if (existing && existing.status !== "failed") return;
    } else if (supplier.name === "mock") {
      await writePrintJob(order);
    }
    const input: SupplierOrderInput = {
      externalId: order.id,
      address: order.address,
      items: await Promise.all(order.lines.map(async (l) => ({ productId: l.productId, color: l.color, size: l.size, quantity: l.quantity, designUrl: await getDesignUrl(l) }))),
    };
    const res = await supplier.createOrder(input);
    console.info(`[fulfilment] order ${order.id} sent to ${supplier.name}: ${res.supplierOrderId}`);
    await record({ status: res.status, supplierOrderId: res.supplierOrderId }, "in_production");
  } catch (err) {
    console.error(`[fulfilment] order ${order.id} failed`, err);
    await record({ status: "failed", error: String((err as Error).message ?? err).slice(0, 300) }).catch(() => undefined);
  }
}
