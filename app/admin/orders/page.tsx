import { notFound } from "next/navigation";
import { adminAllowed } from "@/lib/admin/auth";
import { listOrders } from "@/lib/orders";
import { listPrintFiles } from "@/lib/printjob";
import { getProduct } from "@/lib/products";
import { moneyPaise } from "@/lib/utils";
import { OrderActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  if (!adminAllowed(token)) notFound();
  const orders = await listOrders();
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Orders</h1>
      <p className="mb-6 text-sm text-slate-500">{orders.length} order(s). Print files are written to <code>.data/print-jobs/&lt;order&gt;</code> in local mode.</p>
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-xs">{o.id}</div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">{o.status}</span>
            </div>
            <div className="mt-2 text-sm">{o.address.name} · {o.address.city} {o.address.pincode} · {o.address.phone} · <b>{moneyPaise(o.total)}</b></div>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {o.lines.map((l, i) => (
                <li key={i}>{getProduct(l.productId)?.name ?? l.productId} — {l.color}{l.size ? `, ${l.size}` : ""} × {l.quantity} <span className="text-slate-500">({l.designSlug ? `ready-made: ${l.designSlug}` : "customer upload"})</span></li>
              ))}
            </ul>
            {o.shipment && <div className="mt-2 text-xs text-slate-500">Supplier: {o.shipment.supplier} · {o.shipment.status}{o.shipment.supplierOrderId ? ` · ${o.shipment.supplierOrderId}` : ""}{o.shipment.trackingNumber ? ` · tracking ${o.shipment.trackingNumber}` : ""}{o.shipment.error ? ` · error: ${o.shipment.error}` : ""}</div>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {listPrintFiles(o.id).map((f) => (
                <a key={f} className="text-brand-600 underline" target="_blank" href={`/api/admin/orders/${o.id}/files/${f}${q}`}>{f}</a>
              ))}
            </div>
            <OrderActions id={o.id} status={o.status} token={token} />
          </div>
        ))}
      </div>
    </main>
  );
}
