"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { moneyPaise } from "@/lib/utils";

interface Order { id: string; status: string; total: number; items: { name: string; color: string; size?: string; quantity: number }[]; tracking: string | null; carrier: string | null }

export default function OrderPage({ params }: { params: { id: string } }) {
  const [o, setO] = useState<Order | null | undefined>(undefined);
  useEffect(() => { fetch(`/api/orders/${params.id}`).then((r) => (r.ok ? r.json() : null)).then(setO).catch(() => setO(null)); }, [params.id]);
  if (o === undefined) return <main className="p-8">Loading…</main>;
  if (!o) return <main className="p-8">Order not found.</main>;
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <h1 className="text-2xl font-bold text-green-700 dark:text-green-300">Thank you — order confirmed!</h1>
        <p className="mt-1 text-sm">Order <span className="font-mono">{o.id.slice(0, 8)}</span> · status: <b>{o.status.replace("_", " ")}</b></p>
      </div>
      <ul className="mt-6 space-y-1 text-sm">
        {o.items.map((i, n) => <li key={n}>{i.name} — {i.color}{i.size ? `, ${i.size}` : ""} × {i.quantity}</li>)}
      </ul>
      <p className="mt-3 font-semibold">Paid: {moneyPaise(o.total)}</p>
      {o.tracking && <p className="mt-2 text-sm">Tracking: {o.carrier} {o.tracking}</p>}
      <Link href="/designs" className="mt-6 inline-block text-brand-600 underline">Keep shopping</Link>
    </main>
  );
}
