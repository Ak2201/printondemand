"use client";
import { useState } from "react";
import { DesignCard } from "@/components/shop/design-card";
import { catalogDesigns, designCategories } from "@/lib/design-catalog";
import { cn } from "@/lib/utils";

export default function Designs() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const list = catalogDesigns.filter((d) => (cat === "All" || d.category === cat) && (!q || `${d.name} ${d.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Ready-made designs</h1>
      <p className="mb-4 text-slate-500">Already designed T-shirts, hoodies, mugs and more — buy as is, or tweak any design in the customizer.</p>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["All", ...designCategories].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-3 py-1 text-sm", cat === c ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>{c}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs" className="ml-auto rounded border border-slate-300 bg-transparent px-3 py-1 text-sm dark:border-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {list.map((d) => <DesignCard key={d.slug} design={d} />)}
      </div>
      {list.length === 0 && <p className="text-slate-500">No designs match.</p>}
    </main>
  );
}
