import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAllowed, tokenFrom } from "@/lib/admin/auth";
import { setShipment } from "@/lib/orders";

const schema = z.object({ trackingNumber: z.string().trim().min(3).max(60), carrier: z.string().trim().max(40).optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!adminAllowed(tokenFrom(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await setShipment(params.id, { trackingNumber: body.data.trackingNumber, carrier: body.data.carrier ?? null, status: "shipped", orderStatus: "shipped" });
  return NextResponse.json({ ok: true });
}
