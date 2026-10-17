import { NextResponse } from "next/server";
import { markPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const raw = await req.text(); // must be the raw body for signature verification
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(raw);
  const eventId = req.headers.get("x-razorpay-event-id") ?? undefined;

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const pay = event.payload?.payment?.entity;
    if (pay?.order_id && pay?.id) {
      await markPaid({ razorpayOrderId: pay.order_id, paymentId: pay.id, amount: pay.amount, eventId });
    }
  }
  return NextResponse.json({ received: true });
}
