import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types";

export async function POST(req: Request) {
  const { items } = (await req.json()) as { items: CartItem[] };
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ mock: true, message: "Stripe not configured — mock checkout succeeded." });
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const stripe = new Stripe(key);
  // Prices are recomputed from the quantity/price sent; in production look them up server-side by productId.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((i) => ({
      quantity: i.quantity,
      price_data: { currency: "usd", unit_amount: Math.round(i.price * 100), product_data: { name: `${i.name} (${i.color})` } },
    })),
    success_url: `${site}/shop?success=1`,
    cancel_url: `${site}/shop`,
  });
  return NextResponse.json({ url: session.url });
}
