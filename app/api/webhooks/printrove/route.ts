import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

/**
 * Supplier status/tracking updates. Configure the webhook URL in Printrove as
 *   https://<domain>/api/webhooks/printrove?token=<PRINTROVE_WEBHOOK_TOKEN>
 * UNVERIFIED: payload field names below are guesses; adjust once real payloads are seen in logs.
 */
export async function POST(req: Request) {
  const expected = process.env.PRINTROVE_WEBHOOK_TOKEN;
  const given = new URL(req.url).searchParams.get("token") ?? "";
  const a = Buffer.from(given), b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  console.log("[printrove webhook]", JSON.stringify(body)?.slice(0, 1000));
  const supplierOrderId = String(body?.order?.id ?? body?.id ?? "");
  const tracking = body?.tracking_number ?? body?.order?.tracking_number;
  const status = String(body?.status ?? body?.order?.status ?? "");
  const db = getAdmin();
  if (db && supplierOrderId) {
    const { data: ship } = await db.from("shipments").update({ status, tracking_number: tracking ?? null, carrier: body?.courier ?? null, updated_at: new Date().toISOString() })
      .eq("supplier", "printrove").eq("supplier_order_id", supplierOrderId).select("order_id").maybeSingle();
    if (ship) {
      const s = status.toLowerCase();
      const next = s.includes("deliver") ? "delivered" : s.includes("ship") || tracking ? "shipped" : null;
      if (next) await db.from("orders").update({ status: next }).eq("id", ship.order_id);
    }
  }
  return NextResponse.json({ received: true });
}
