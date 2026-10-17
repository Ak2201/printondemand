import { NextResponse } from "next/server";
import { adminAllowed, tokenFrom } from "@/lib/admin/auth";
import { fulfilOrder } from "@/lib/fulfilment";
import { getOrder } from "@/lib/orders";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!adminAllowed(tokenFrom(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const o = await getOrder(params.id);
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (o.status === "pending") return NextResponse.json({ error: "Order is not paid" }, { status: 400 });
  await fulfilOrder(o);
  return NextResponse.json({ order: await getOrder(params.id) });
}
