import Link from "next/link";
import { ProductMockup } from "@/components/mockup/product-mockup";
import { DesignCard } from "@/components/shop/design-card";
import { catalogDesigns } from "@/lib/design-catalog";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Wear your <span className="text-brand-600">own design</span>.</h1>
          <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-400">Upload a photo from your phone or laptop, see it on a T-shirt, hoodie, mug or case instantly — or pick a ready-made design. Printed on demand and delivered across India.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/customizer" className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">Design your own</Link>
            <Link href="/designs" className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">Shop ready-made</Link>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-slate-200 p-4 dark:from-slate-800 dark:to-slate-900">
          <ProductMockup productId="tshirt" color="#111827" view="front" designSrc="/designs/retro-sunset.svg" className="mx-auto w-full max-w-md" />
        </div>
      </section>
      <section className="mt-16">
        <div className="mb-4 flex items-end justify-between"><h2 className="text-2xl font-bold">Popular designs</h2><Link href="/designs" className="text-sm text-brand-600 underline">See all →</Link></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {catalogDesigns.slice(0, 4).map((d) => <DesignCard key={d.slug} design={d} />)}
        </div>
      </section>
    </main>
  );
}
