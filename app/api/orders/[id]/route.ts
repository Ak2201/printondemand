import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { getProduct } from "@/lib/products";

/** Public order status, protected only by the unguessable order uuid. No PII returned. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/.test(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = await getOrder(params.id);
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: o.id, status: o.status, total: o.total, createdAt: o.createdAt,
    items: o.lines.map((l) => ({ name: getProduct(l.productId)?.name ?? l.productId, color: l.color, size: l.size, quantity: l.quantity })),
    tracking: o.shipment?.trackingNumber ?? null, carrier: o.shipment?.carrier ?? null,
  });
}
