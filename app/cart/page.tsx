"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductMockup } from "@/components/mockup/product-mockup";
import { getProduct } from "@/lib/products";
import Script from "next/script";
import { useEffect, useState } from "react";
import { FLAT_SHIPPING, FREE_SHIPPING_ABOVE } from "@/lib/checkout";
import { moneyPaise } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { Address } from "@/types";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } } }

const empty: Address = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
const field = "w-full rounded border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700";

export default function CartPage() {
  const router = useRouter();
  const { items, remove, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [addr, setAddr] = useState<Address>(empty);
  useEffect(() => setMounted(true), []);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : FLAT_SHIPPING;
  const setA = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const confirm = async (d: { razorpayOrderId: string; amount: number }, r: { razorpay_payment_id: string; razorpay_signature: string }) => {
    const res = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpay_order_id: d.razorpayOrderId, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature, amount: d.amount }) });
    if (res.ok) { const v = await res.json(); clear(); router.push(`/orders/${v.orderId}`); }
    else setNote({ ok: false, text: "Payment could not be verified. If you were charged, contact support." });
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, designPath: i.designPath, designSlug: i.designSlug, quantity: i.quantity })), address: addr }) });
      const d = await res.json();
      if (!res.ok) { setNote({ ok: false, text: d.error ?? "Checkout failed" }); return; }
      if (d.mock) { await confirm(d, { razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock" }); return; }
      if (!window.Razorpay) { setNote({ ok: false, text: "Payment library failed to load. Refresh and retry." }); return; }
      const rzp = new window.Razorpay({
        key: d.keyId, amount: d.amount, currency: d.currency, order_id: d.razorpayOrderId, name: "PrintForge",
        prefill: { name: addr.name, email: addr.email, contact: addr.phone },
        handler: (r: { razorpay_payment_id: string; razorpay_signature: string }) => confirm(d, r),
      });
      rzp.on("payment.failed", () => setNote({ ok: false, text: "Payment failed. You can try again." }));
      rzp.open();
    } catch { setNote({ ok: false, text: "Checkout failed." }); } finally { setBusy(false); }
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_340px]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <section>
        <h1 className="mb-4 text-2xl font-bold">Your cart</h1>
        {mounted && items.length === 0 && <p className="text-slate-500">Your cart is empty. <Link href="/designs" className="text-brand-600 underline">Browse designs</Link> or <Link href="/customizer" className="text-brand-600 underline">design your own</Link>.</p>}
        <div className="space-y-3">
          {mounted && items.map((i) => {
            const p = getProduct(i.productId);
            const color = p?.colors.find((c) => c.name === i.color)?.hex ?? "#fff";
            return (
              <div key={i.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="w-24 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800"><ProductMockup productId={i.productId} color={color} view={i.view ?? "front"} designSrc={i.preview} className="w-full" /></div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-slate-500">{i.color}{i.size ? ` · ${i.size}` : ""} · qty {i.quantity} · {i.designSlug ? "ready-made" : "your design"}</div>
                </div>
                <div className="text-sm font-semibold">{moneyPaise(i.price * i.quantity)}</div>
                <button onClick={() => remove(i.id)} className="px-2 text-red-600" aria-label="Remove">×</button>
              </div>
            );
          })}
        </div>
      </section>
      {mounted && items.length > 0 && (
        <aside className="h-fit rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <form onSubmit={checkout} className="space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{moneyPaise(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span>{shipping === 0 ? "Free" : moneyPaise(shipping)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-800"><span>Total</span><span>{moneyPaise(subtotal + shipping)}</span></div>
            <h2 className="pt-2 text-sm font-semibold">Delivery address</h2>
            <input required placeholder="Full name" value={addr.name} onChange={setA("name")} className={field} />
            <input required type="email" placeholder="Email" value={addr.email} onChange={setA("email")} className={field} />
            <input required inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="Mobile (10 digits)" value={addr.phone} onChange={setA("phone")} className={field} />
            <input required placeholder="Address line 1" value={addr.line1} onChange={setA("line1")} className={field} />
            <input placeholder="Address line 2" value={addr.line2} onChange={setA("line2")} className={field} />
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="City" value={addr.city} onChange={setA("city")} className={field} />
              <input required placeholder="State" value={addr.state} onChange={setA("state")} className={field} />
            </div>
            <input required inputMode="numeric" pattern="[1-9][0-9]{5}" placeholder="Pincode" value={addr.pincode} onChange={setA("pincode")} className={field} />
            <button disabled={busy} className="w-full rounded-lg bg-brand-600 p-2.5 text-white disabled:opacity-50">{busy ? "Processing…" : "Pay with Razorpay"}</button>
            <p className="text-xs text-slate-500">Prepaid orders only. Prices include GST.</p>
            {note && <p className={`text-sm ${note.ok ? "text-green-600" : "text-red-600"}`}>{note.text}</p>}
          </form>
        </aside>
      )}
    </main>
  );
}
