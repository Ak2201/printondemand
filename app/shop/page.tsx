"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";
import { money } from "@/lib/utils";
import { useCart } from "@/store/cart";

export default function Shop() {
  const { items, remove, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => setMounted(true), []);
  const total = items.reduce((n, i) => n + i.price * i.quantity, 0);

  const checkout = async () => {
    setBusy(true); setNote("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(({ preview, ...i }) => i) }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setNote(data.message ?? "Mock checkout complete."); clear(); }
    } catch { setNote("Checkout failed."); } finally { setBusy(false); }
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Shop</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-5xl">{p.emoji}</div>
              <div className="mt-2 font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">{money(p.suggestedPrice)}</div>
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
            {i.preview && <img src={i.preview} alt="" className="h-10 w-10 rounded object-contain" style={{ background: i.color }} />}
            <span className="flex-1">{i.name} × {i.quantity}</span>
            <span>{money(i.price * i.quantity)}</span>
            <button onClick={() => remove(i.id)} className="text-red-600" aria-label="Remove">×</button>
          </div>
        ))}
        {mounted && items.length > 0 && (
          <>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold dark:border-slate-800"><span>Total</span><span>{money(total)}</span></div>
            <button disabled={busy} onClick={checkout} className="mt-3 w-full rounded-lg bg-brand-600 p-2.5 text-white disabled:opacity-50">{busy ? "Processing…" : "Checkout"}</button>
          </>
        )}
        {note && <p className="mt-3 text-sm text-green-600">{note}</p>}
      </aside>
    </main>
  );
}
