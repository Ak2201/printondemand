import { NextResponse } from "next/server";
import { buildSupplierOrder } from "@/lib/pod";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.items?.length || !body?.recipient) {
    return NextResponse.json({ error: "items and recipient are required" }, { status: 400 });
  }
  const provider = process.env.POD_PROVIDER ?? "printful";
  const payload = buildSupplierOrder(body.items, body.recipient, provider);
  if (!process.env.POD_API_KEY) {
    return NextResponse.json({ mock: true, provider, payload }, { status: 201 });
  }
  // TODO: forward to supplier (Printful: POST https://api.printful.com/orders; Printify: /v1/shops/{id}/orders.json)
  return NextResponse.json({ provider, payload, submitted: false }, { status: 202 });
}
