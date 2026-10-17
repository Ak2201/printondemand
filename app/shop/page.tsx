import Link from "next/link";
import { ProductMockup } from "@/components/mockup/product-mockup";
import { DesignCard } from "@/components/shop/design-card";
import { catalogDesigns } from "@/lib/design-catalog";
import { products } from "@/lib/products";
import { moneyPaise } from "@/lib/utils";

export default function Shop() {
  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><h1 className="text-2xl font-bold">Ready-made T-shirts</h1><p className="text-slate-500">Pick a design, choose colour &amp; size, done.</p></div>
          <Link href="/designs" className="text-sm text-brand-600 underline">All designs →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {catalogDesigns.slice(0, 8).map((d) => <DesignCard key={d.slug} design={d} />)}
        </div>
      </section>
      <section>
        <h2 className="mb-1 text-2xl font-bold">Design your own</h2>
        <p className="mb-4 text-slate-500">Upload your photo or artwork and see it on the product before you buy.</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {products.map((p) => (
            <Link key={p.id} href={`/customizer?product=${p.id}`} className="overflow-hidden rounded-xl border border-slate-200 transition hover:shadow-lg dark:border-slate-800">
              <div className="bg-gradient-to-b from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900"><ProductMockup productId={p.id} color={p.colors[0].hex} view={p.views[0]} className="w-full" /></div>
              <div className="p-3"><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-slate-500">{moneyPaise(p.price)} · Customize →</div></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
