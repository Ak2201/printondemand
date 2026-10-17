"use client";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";
import { FLAT_SHIPPING, FREE_SHIPPING_ABOVE } from "@/lib/checkout";
import { moneyPaise } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { Address } from "@/types";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } } }

const empty: Address = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
const field = "w-full rounded border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700";

export default function Shop() {
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
    if (res.ok) { clear(); setNote({ ok: true, text: "Payment successful — your order is confirmed." }); }
    else setNote({ ok: false, text: "Payment could not be verified. If you were charged, contact support." });
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, designPath: i.designPath, quantity: i.quantity })), address: addr }) });
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
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <section>
        <h1 className="mb-4 text-2xl font-bold">Shop</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-5xl">{p.emoji}</div>
              <div className="mt-2 font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">{moneyPaise(p.price)}</div>
              <Link href={`/customizer?product=${p.id}`} className="mt-3 inline-block rounded bg-brand-600 px-3 py-1.5 text-sm text-white">Customize</Link>
            </div>
          ))}
        </div>
      </section>
      <aside className="h-fit rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mb-3 font-semibold">Cart</h2>
        {mounted && items.length === 0 && <p className="text-sm text-slate-500">Your cart is empty.</p>}
        {mounted && items.map((i) => (
          <div key={i.id} className="mb-2 flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.preview && <img src={i.preview} alt="" className="h-10 w-10 rounded object-contain" />}
            <span className="flex-1">{i.name} ({i.color}{i.size ? `, ${i.size}` : ""}) × {i.quantity}</span>
            <span>{moneyPaise(i.price * i.quantity)}</span>
            <button onClick={() => remove(i.id)} className="text-red-600" aria-label="Remove">×</button>
          </div>
        ))}
        {mounted && items.length > 0 && (
          <form onSubmit={checkout} className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="flex justify-between text-sm"><span>Shipping</span><span>{shipping === 0 ? "Free" : moneyPaise(shipping)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{moneyPaise(subtotal + shipping)}</span></div>
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
          </form>
        )}
        {note && <p className={`mt-3 text-sm ${note.ok ? "text-green-600" : "text-red-600"}`}>{note.text}</p>}
      </aside>
    </main>
  );
}
