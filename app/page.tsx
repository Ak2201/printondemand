import Link from "next/link";
import { products } from "@/lib/products";
import { moneyPaise } from "@/lib/utils";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Design it. Sell it. <span className="text-brand-600">Never stock it.</span></h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">Create custom products in the browser, see your margins instantly, and let suppliers print and ship every order.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/customizer" className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">Start designing</Link>
          <Link href="/pricing-calculator" className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">Calculate profit</Link>
        </div>
      </section>
      <section className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-5">
        {products.map((p) => (
          <Link key={p.id} href={`/customizer?product=${p.id}`} className="rounded-xl border border-slate-200 p-4 text-center transition hover:shadow-md dark:border-slate-800">
            <div className="text-5xl">{p.emoji}</div>
            <div className="mt-2 text-sm font-medium">{p.name}</div>
            <div className="text-xs text-slate-500">from {moneyPaise(p.price)}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
