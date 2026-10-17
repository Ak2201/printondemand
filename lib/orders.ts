import { fulfilOrder, type OrderSnapshot } from "@/lib/fulfilment";
import { getAdmin } from "@/lib/supabase/admin";
import type { Address } from "@/types";

interface NewOrder {
  address: Address;
  lines: { productId: string; color: string; size?: string; quantity: number; unitPrice: number; designPath?: string }[];
  subtotal: number;
  shipping: number;
  total: number;
  razorpayOrderId: string;
}

// Dev-only fallback when Supabase is not configured. Not durable and not shared across serverless instances.
const mem = { orders: new Map<string, { id: string; status: string; total: number; snap: OrderSnapshot }>(), events: new Set<string>() };

export async function createPendingOrder(o: NewOrder): Promise<string> {
  const db = getAdmin();
  if (!db) {
    const id = crypto.randomUUID();
    mem.orders.set(o.razorpayOrderId, { id, status: "pending", total: o.total, snap: { id, address: o.address, lines: o.lines } });
    return id;
  }
  const { data, error } = await db.from("orders").insert({
    email: o.address.email, phone: o.address.phone, address: o.address,
    subtotal_paise: o.subtotal, shipping_paise: o.shipping, total_paise: o.total,
    razorpay_order_id: o.razorpayOrderId,
  }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await db.from("order_items").insert(
    o.lines.map((l) => ({ order_id: data.id, product_id: l.productId, color: l.color, size: l.size ?? null, quantity: l.quantity, unit_price_paise: l.unitPrice, design_path: l.designPath ?? null })),
  );
  if (e2) throw e2;
  return data.id;
}

/** Idempotent: returns false if this event/payment was already processed. */
export async function markPaid(args: { razorpayOrderId: string; paymentId: string; amount: number; eventId?: string }): Promise<boolean> {
  const db = getAdmin();
  if (!db) {
    const key = args.eventId ?? args.paymentId;
    if (mem.events.has(key)) return false;
    mem.events.add(key);
    const ord = mem.orders.get(args.razorpayOrderId);
    if (ord) { ord.status = "paid"; await fulfilOrder(ord.snap); }
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
  const { data: items, error: iErr } = await db.from("order_items").select("product_id,color,size,quantity,design_path").eq("order_id", order.id);
  if (iErr) throw iErr;
  const { data: full } = await db.from("orders").select("address").eq("id", order.id).single();
  await fulfilOrder({
    id: order.id,
    address: full!.address as Address,
    lines: items.map((i) => ({ productId: i.product_id, color: i.color, size: i.size ?? undefined, quantity: i.quantity, designPath: i.design_path ?? undefined })),
  });
  return true;
}
