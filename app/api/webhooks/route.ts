import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  let event: { type: string; data?: unknown };

  if (secret && key) {
    try {
      event = new Stripe(key).webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    event = JSON.parse(raw || "{}"); // dev only: unsigned
  }

  if (event.type === "checkout.session.completed") {
    // TODO: create supplier order via /api/orders logic
  }
  // Supplier webhooks (e.g. package_shipped) would be handled here too.
  return NextResponse.json({ received: true });
}
