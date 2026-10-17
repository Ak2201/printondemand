import { NextResponse } from "next/server";
import { checkoutSchema, priceCart } from "@/lib/checkout";
import { checkDesignsExist } from "@/lib/designs";
import { createPendingOrder } from "@/lib/orders";
import { getRazorpay, mockAllowed, razorpayConfigured } from "@/lib/razorpay";

export async function POST(req: Request) {
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, address } = parsed.data;

  let cart;
  try { cart = priceCart(items); } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const missing = checkDesignsExist(items);
  if (missing) return NextResponse.json({ error: missing }, { status: 400 });

  let razorpayOrderId: string;
  if (razorpayConfigured()) {
    const rzp = await getRazorpay().orders.create({
      amount: cart.total, currency: "INR", receipt: `rcpt_${Date.now()}`,
      notes: { email: address.email },
    });
    razorpayOrderId = rzp.id;
  } else if (mockAllowed()) {
    razorpayOrderId = `order_mock_${Date.now()}`;
  } else {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const orderId = await createPendingOrder({ address, lines: cart.lines, subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total, razorpayOrderId });
  return NextResponse.json({
    orderId, razorpayOrderId, amount: cart.total, currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID ?? null, mock: !razorpayConfigured(),
    subtotal: cart.subtotal, shipping: cart.shipping,
  });
}
