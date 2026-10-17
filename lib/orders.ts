import { fulfilOrder } from "@/lib/fulfilment";
import { localRead, localTx } from "@/lib/local-store";
import type { OrderLine, ShipmentInfo, StoredOrder } from "@/lib/order-types";
import { getAdmin } from "@/lib/supabase/admin";
import type { Address } from "@/types";

interface NewOrder {
  address: Address;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  razorpayOrderId: string;
}

// Supabase when configured; otherwise a file-backed local store (.data/orders.json) for development.

export async function createPendingOrder(o: NewOrder): Promise<string> {
  const db = getAdmin();
  if (!db) {
    const id = crypto.randomUUID();
    await localTx((d) => {
      d.orders[id] = { id, status: "pending", createdAt: new Date().toISOString(), address: o.address, lines: o.lines, subtotal: o.subtotal, shipping: o.shipping, total: o.total, razorpayOrderId: o.razorpayOrderId };
    });
    return id;
  }
  const { data, error } = await db.from("orders").insert({
    email: o.address.email, phone: o.address.phone, address: o.address,
    subtotal_paise: o.subtotal, shipping_paise: o.shipping, total_paise: o.total,
    razorpay_order_id: o.razorpayOrderId,
  }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await db.from("order_items").insert(
    o.lines.map((l) => ({ order_id: data.id, product_id: l.productId, color: l.color, size: l.size ?? null, quantity: l.quantity, unit_price_paise: l.unitPrice, design_path: l.designPath ?? null, design_slug: l.designSlug ?? null })),
  );
  if (e2) throw e2;
  return data.id;
}

export async function getOrderIdByRazorpayId(razorpayOrderId: string): Promise<string | null> {
  const db = getAdmin();
  if (!db) return Object.values(localRead().orders).find((o) => o.razorpayOrderId === razorpayOrderId)?.id ?? null;
  const { data } = await db.from("orders").select("id").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  return data?.id ?? null;
}

/** Idempotent: returns false if this event/payment was already processed. */
export async function markPaid(args: { razorpayOrderId: string; paymentId: string; amount: number; eventId?: string }): Promise<boolean> {
  const db = getAdmin();
  if (!db) {
    const key = args.eventId ?? args.paymentId;
    const order = await localTx((d) => {
      if (d.events.includes(key) || d.payments.includes(args.paymentId)) return null;
      const ord = Object.values(d.orders).find((o) => o.razorpayOrderId === args.razorpayOrderId);
      if (!ord) throw new Error("Unknown order");
      if (ord.total !== args.amount) throw new Error("Amount mismatch");
      d.events.push(key); d.payments.push(args.paymentId);
      if (ord.status === "pending") ord.status = "paid";
      return { ...ord };
    });
    if (!order) return false;
    await fulfilOrder(order);
    return true;
  }
  if (args.eventId) {
    const { error } = await db.from("webhook_events").insert({ id: args.eventId, source: "razorpay" });
    if (error?.code === "23505") return false; // duplicate delivery
    if (error) throw error;
  }
  const { data: order, error: oErr } = await db.from("orders").select("id,total_paise,status").eq("razorpay_order_id", args.razorpayOrderId).single();
  if (oErr) throw oErr;
  if (order.total_paise !== args.amount) throw new Error("Amount mismatch");
  const { error: pErr } = await db.from("payments").insert({ order_id: order.id, razorpay_payment_id: args.paymentId, amount_paise: args.amount, status: "captured" });
  if (pErr?.code === "23505") return false; // payment already recorded (verify route vs webhook race)
  if (pErr) throw pErr;
  if (order.status === "pending") await db.from("orders").update({ status: "paid" }).eq("id", order.id);
  const full = await getOrder(order.id);
  if (full) await fulfilOrder(full);
  return true;
}

function fromRow(o: any, items: any[], ship: any | null): StoredOrder {
  return {
    id: o.id, status: o.status, createdAt: o.created_at, address: o.address as Address,
    lines: items.map((i) => ({ productId: i.product_id, color: i.color, size: i.size ?? undefined, quantity: i.quantity, unitPrice: i.unit_price_paise, designPath: i.design_path ?? undefined, designSlug: i.design_slug ?? undefined })),
    subtotal: o.subtotal_paise, shipping: o.shipping_paise, total: o.total_paise, razorpayOrderId: o.razorpay_order_id,
    shipment: ship ? { supplier: ship.supplier, supplierOrderId: ship.supplier_order_id, status: ship.status, trackingNumber: ship.tracking_number, carrier: ship.carrier, updatedAt: ship.updated_at } : null,
  };
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  const db = getAdmin();
  if (!db) return localRead().orders[id] ?? null;
  const { data: o } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!o) return null;
  const { data: items } = await db.from("order_items").select("*").eq("order_id", id);
  const { data: ship } = await db.from("shipments").select("*").eq("order_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return fromRow(o, items ?? [], ship);
}

export async function listOrders(limit = 100): Promise<StoredOrder[]> {
  const db = getAdmin();
  if (!db) return Object.values(localRead().orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  const { data: orders } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  const ids = (orders ?? []).map((o) => o.id);
  const [{ data: items }, { data: ships }] = await Promise.all([
    db.from("order_items").select("*").in("order_id", ids),
    db.from("shipments").select("*").in("order_id", ids),
  ]);
  return (orders ?? []).map((o) => fromRow(o, (items ?? []).filter((i) => i.order_id === o.id), (ships ?? []).find((s) => s.order_id === o.id) ?? null));
}

export async function setShipment(id: string, patch: Partial<ShipmentInfo> & { orderStatus?: string }): Promise<void> {
  const db = getAdmin();
  const now = new Date().toISOString();
  if (!db) {
    await localTx((d) => {
      const o = d.orders[id]; if (!o) throw new Error("Unknown order");
      const { orderStatus, ...s } = patch;
      o.shipment = { supplier: "manual", ...(o.shipment ?? {}), ...s, updatedAt: now };
      if (orderStatus) o.status = orderStatus;
    });
    return;
  }
  const { orderStatus, ...s } = patch;
  await db.from("shipments").upsert({ order_id: id, supplier: s.supplier ?? "manual", supplier_order_id: s.supplierOrderId, status: s.status, tracking_number: s.trackingNumber, carrier: s.carrier, updated_at: now }, { onConflict: "order_id,supplier" });
  if (orderStatus) await db.from("orders").update({ status: orderStatus }).eq("id", id);
}
