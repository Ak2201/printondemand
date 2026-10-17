"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderActions({ id, status, token }: { id: string; status: string; token: string }) {
  const router = useRouter();
  const [tracking, setTracking] = useState("");
  const [msg, setMsg] = useState("");
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  const call = async (path: string, body?: unknown) => {
    const res = await fetch(`/api/admin/orders/${id}/${path}${q}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setMsg(res.ok ? "Done" : (await res.json().catch(() => ({}))).error ?? "Failed");
    router.refresh();
  };
  if (status === "pending") return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <button onClick={() => call("retry")} className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700">Retry fulfilment</button>
      <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" className="rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-700" />
      <button disabled={tracking.length < 3} onClick={() => call("ship", { trackingNumber: tracking })} className="rounded bg-brand-600 px-2 py-1 text-white disabled:opacity-50">Mark shipped</button>
      {msg && <span className="text-slate-500">{msg}</span>}
    </div>
  );
}
