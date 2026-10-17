import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderIdByRazorpayId, markPaid } from "@/lib/orders";
import { mockAllowed, razorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const b = parsed.data;

  if (razorpayConfigured()) {
    if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
      return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
    }
  } else if (!mockAllowed()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  await markPaid({ razorpayOrderId: b.razorpay_order_id, paymentId: b.razorpay_payment_id, amount: b.amount });
  return NextResponse.json({ verified: true, orderId: await getOrderIdByRazorpayId(b.razorpay_order_id) });
}
