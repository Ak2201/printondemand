"use client";
import { useMemo, useState } from "react";
import { products } from "@/lib/products";
import { calculatePricing } from "@/lib/pricing";
import { money } from "@/lib/utils";

const Slider = ({ label, value, min, max, step = 1, onChange, fmt }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; fmt?: (n: number) => string }) => (
  <label className="block text-sm">
    <div className="flex justify-between"><span>{label}</span><strong>{fmt ? fmt(value) : value}</strong></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full" />
  </label>
);

export default function PricingCalculator() {
  const [productId, setProductId] = useState(products[0].id);
  const p = products.find((x) => x.id === productId)!;
  const [v, setV] = useState({ baseCost: p.baseCost, shipping: p.shipping, sellingPrice: p.suggestedPrice, monthlyUnits: 100, adSpend: 300, feePercent: 2.9, feeFixed: 0.3 });
  const set = (k: keyof typeof v) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const r = useMemo(() => calculatePricing(v), [v]);

  const pick = (id: string) => {
    const np = products.find((x) => x.id === id)!;
    setProductId(id);
    setV((s) => ({ ...s, baseCost: np.baseCost, shipping: np.shipping, sellingPrice: np.suggestedPrice }));
  };

  const stats: [string, string, boolean?][] = [
    ["Profit / unit", money(r.profitPerUnit), r.profitPerUnit < 0],
    ["Margin", `${r.margin.toFixed(1)}%`, r.margin < 0],
    ["Monthly profit", money(r.monthlyProfit), r.monthlyProfit < 0],
    ["ROI", `${r.roi.toFixed(1)}%`, r.roi < 0],
    ["Break-even units", Number.isFinite(r.breakEvenUnits) ? String(r.breakEvenUnits) : "—"],
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Pricing &amp; margin calculator</h1>
        <select value={productId} onChange={(e) => pick(e.target.value)} className="w-full rounded border border-slate-300 bg-transparent p-2 dark:border-slate-700">
          {products.map((x) => <option key={x.id} value={x.id} className="text-black">{x.name}</option>)}
        </select>
        <Slider label="Base cost" value={v.baseCost} min={1} max={60} step={0.25} onChange={set("baseCost")} fmt={money} />
        <Slider label="Shipping" value={v.shipping} min={0} max={20} step={0.25} onChange={set("shipping")} fmt={money} />
        <Slider label="Selling price" value={v.sellingPrice} min={5} max={150} step={0.5} onChange={set("sellingPrice")} fmt={money} />
        <Slider label="Units / month" value={v.monthlyUnits} min={1} max={2000} onChange={set("monthlyUnits")} />
        <Slider label="Ad spend / month" value={v.adSpend} min={0} max={10000} step={50} onChange={set("adSpend")} fmt={money} />
        <Slider label="Payment fee %" value={v.feePercent} min={0} max={10} step={0.1} onChange={set("feePercent")} fmt={(n) => `${n}%`} />
      </section>
      <section className="grid h-fit grid-cols-2 gap-3">
        {stats.map(([k, val, neg]) => (
          <div key={k} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-xs text-slate-500">{k}</div>
            <div className={`text-2xl font-bold ${neg ? "text-red-600" : ""}`}>{val}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
