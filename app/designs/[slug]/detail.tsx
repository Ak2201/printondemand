"use client";
import Link from "next/link";
import { useState } from "react";
import { ProductMockup } from "@/components/mockup/product-mockup";
import type { CatalogDesign } from "@/lib/design-catalog";
import { getProduct } from "@/lib/products";
import { cn, moneyPaise } from "@/lib/utils";
import { useCart } from "@/store/cart";

export function DesignDetail({ design }: { design: CatalogDesign }) {
  const add = useCart((s) => s.add);
  const [productId, setProductId] = useState("tshirt");
  const product = getProduct(productId)!;
  const [colorName, setColorName] = useState(design.defaultColor);
  const [view] = useState(product.views[0]);
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];

  const pick = (id: string) => {
    const p = getProduct(id)!;
    setProductId(id);
    setColorName(p.colors.find((c) => c.name === design.defaultColor)?.name ?? p.colors[0].name);
  };
  const addToCart = () => {
    add({
      id: `${productId}-${color.name}-${size}-${design.slug}`, productId, name: `${design.name} ${product.name}`,
      color: color.name, size: product.sizes ? size : undefined, price: product.price, quantity: qty, designSlug: design.slug,
      preview: design.src, view,
    });
    setAdded(true);
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-200 dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
        <ProductMockup productId={productId} color={color.hex} view={view} designSrc={design.src} className="w-full" />
      </div>
      <div className="space-y-5">
        <div>
          <Link href="/designs" className="text-sm text-brand-600">← All designs</Link>
          <h1 className="mt-1 text-3xl font-bold">{design.name}</h1>
          <p className="text-slate-500">{design.tagline}</p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Product</h2>
          <div className="flex flex-wrap gap-2">
            {design.productIds.map((id) => {
              const p = getProduct(id)!;
              return <button key={id} onClick={() => pick(id)} className={cn("rounded-full border px-3 py-1 text-sm", id === productId ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>{p.emoji} {p.name}</button>;
            })}
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Color: {color.name}</h2>
          <div className="flex gap-2">
            {product.colors.map((c) => <button key={c.name} aria-label={c.name} onClick={() => setColorName(c.name)} style={{ background: c.hex }} className={cn("h-8 w-8 rounded-full border-2", c.name === color.name ? "border-brand-600 ring-2 ring-brand-500/40" : "border-slate-300")} />)}
          </div>
          {design.suits !== "any" && <p className="mt-1 text-xs text-slate-500">Looks best on {design.suits} colours.</p>}
        </div>
        {product.sizes && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Size</h2>
            <div className="flex gap-2">{product.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={cn("rounded border px-3 py-1 text-sm", s === size ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>{s}</button>)}</div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Qty</span>
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, +e.target.value || 1)))} className="w-20 rounded border border-slate-300 bg-transparent p-1.5 dark:border-slate-700" />
          <span className="ml-auto text-2xl font-bold">{moneyPaise(product.price * qty)}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={addToCart} className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">Add to cart</button>
          <Link href={`/customizer?product=${productId}&color=${color.name}&design=${design.slug}`} className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">Customize this design</Link>
        </div>
        {added && <p className="text-sm text-green-600">Added to cart. <Link href="/cart" className="underline">View cart &amp; pay</Link></p>}
        <p className="text-xs text-slate-500">Prices include GST · prepaid orders · printed on demand after payment.</p>
      </div>
    </main>
  );
}
