"use client";
import { useMemo, useState } from "react";
import { products } from "@/lib/products";
import { calculatePricing, RAZORPAY_FEE_PERCENT } from "@/lib/pricing";
import { money } from "@/lib/utils";

const Slider = ({ label, value, min, max, step = 1, onChange, fmt }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; fmt?: (n: number) => string }) => (
  <label className="block text-sm">
    <div className="flex justify-between"><span>{label}</span><strong>{fmt ? fmt(value) : value}</strong></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full" />
  </label>
);

const fromProduct = (id: string) => {
  const p = products.find((x) => x.id === id)!;
  return { baseCost: p.baseCost / 100, shipping: p.shipping / 100, sellingPrice: p.price / 100, gstRate: p.gstRate };
};

export default function PricingCalculator() {
  const [productId, setProductId] = useState(products[0].id);
  const [v, setV] = useState({ ...fromProduct(products[0].id), monthlyUnits: 100, adSpend: 10000, feePercent: RAZORPAY_FEE_PERCENT });
  const set = (k: keyof typeof v) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const r = useMemo(() => calculatePricing(v), [v]);

  const pick = (id: string) => { setProductId(id); setV((s) => ({ ...s, ...fromProduct(id) })); };

  const stats: [string, string, boolean?][] = [
    ["Profit / unit (after GST)", money(r.profitPerUnit), r.profitPerUnit < 0],
    ["Margin on net revenue", `${r.margin.toFixed(1)}%`, r.margin < 0],
    ["Monthly profit", money(r.monthlyProfit), r.monthlyProfit < 0],
    ["ROI", `${r.roi.toFixed(1)}%`, r.roi < 0],
    ["GST per unit", money(r.gstAmount)],
    ["Break-even units", Number.isFinite(r.breakEvenUnits) ? String(r.breakEvenUnits) : "—"],
  ];

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Pricing &amp; margin calculator</h1>
        <select value={productId} onChange={(e) => pick(e.target.value)} className="w-full rounded border border-slate-300 bg-transparent p-2 dark:border-slate-700">
          {products.map((x) => <option key={x.id} value={x.id} className="text-black">{x.name}</option>)}
        </select>
        <Slider label="Supplier base cost" value={v.baseCost} min={20} max={1500} step={5} onChange={set("baseCost")} fmt={money} />
        <Slider label="Supplier shipping" value={v.shipping} min={0} max={300} step={5} onChange={set("shipping")} fmt={money} />
        <Slider label="Selling price (incl. GST)" value={v.sellingPrice} min={100} max={5000} step={10} onChange={set("sellingPrice")} fmt={money} />
        <Slider label="GST rate" value={v.gstRate} min={0} max={28} step={1} onChange={set("gstRate")} fmt={(n) => `${n}%`} />
        <Slider label="Units / month" value={v.monthlyUnits} min={1} max={2000} onChange={set("monthlyUnits")} />
        <Slider label="Ad spend / month" value={v.adSpend} min={0} max={500000} step={500} onChange={set("adSpend")} fmt={money} />
        <Slider label="Razorpay fee (incl. GST on fee)" value={v.feePercent} min={0} max={5} step={0.01} onChange={set("feePercent")} fmt={(n) => `${n}%`} />
        <p className="text-xs text-slate-500">Costs are placeholders until supplier samples are priced. Confirm GST rates with your CA.</p>
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
